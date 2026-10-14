const fs=require('node:fs/promises'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
const out=path.resolve('quality-output'),FPS=30,FRAMES=180;
const sites=[['junkz-landing','https://junkz-shooter-landing.vercel.app/'],['smokey-space','https://smokey-space.vercel.app/']];
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
  for(const [name,url] of sites){
   const frameDir=path.join(out,name+'-frames');await fs.mkdir(frameDir,{recursive:true});
   const context=await browser.newContext({viewport:{width:1280,height:856},deviceScaleFactor:1});
   const page=await context.newPage();
   await page.clock.install();
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForTimeout(6000);
   await page.evaluate(()=>document.fonts.ready);
   const setup=await page.evaluate(()=>{
    const videos=[...document.querySelectorAll('video')].map((v,i)=>{v.muted=true;v.pause();return {index:i,time:v.currentTime,duration:v.duration,ready:v.readyState};});
    const animations=document.getAnimations().map((a,i)=>{const time=Number(a.currentTime)||0;a.pause();return {index:i,time};});
    return {videos,animations,title:document.title};
   });
   await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+100);
   console.log('QUALITY_START '+JSON.stringify({name,...setup}));
   let lastTick=0;
   for(let frame=0;frame<FRAMES;frame++){
    const tick=Math.round(frame*1000/FPS);
    if(tick>lastTick)await page.clock.runFor(tick-lastTick);
    lastTick=tick;
    await page.evaluate(async({setup,tick})=>{
     const animations=document.getAnimations();
     for(const item of setup.animations){const a=animations[item.index];if(a)a.currentTime=item.time+tick;}
     const videos=[...document.querySelectorAll('video')];
     await Promise.all(setup.videos.filter(item=>item.ready>=2&&Number.isFinite(item.duration)&&item.duration>0).map(item=>new Promise(resolve=>{
      const video=videos[item.index];if(!video)return resolve();
      const time=(item.time+tick/1000)%item.duration;
      if(Math.abs(video.currentTime-time)<0.005)return resolve();
      video.addEventListener('seeked',resolve,{once:true});video.currentTime=time;
     })));
    },{setup,tick});
    await page.clock.runFor(1);
    await page.screenshot({path:path.join(frameDir,String(frame).padStart(4,'0')+'.png'),type:'png',timeout:30000});
    if(frame%30===0)console.log('QUALITY_PROGRESS '+name+' '+frame+'/'+FRAMES);
   }
   const video=path.join(out,name+'.mp4');
   execFileSync('ffmpeg',['-y','-framerate',String(FPS),'-i',path.join(frameDir,'%04d.png'),'-an','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['ignore','ignore','pipe']});
   execFileSync('ffmpeg',['-y','-ss','2','-i',video,'-frames:v','1','-vf','scale=640:-2','-q:v','3',path.join(out,name+'-check.jpg')],{stdio:['ignore','ignore','pipe']});
   const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,nb_read_frames,r_frame_rate:format=duration,size','-of','json',video]));
   const report={name,url,capture:'180 individually rendered frames; controlled animation time; no real-time frame dropping',...metadata};
   console.log('QUALITY_RESULT '+JSON.stringify(report));await fs.writeFile(path.join(out,name+'-report.json'),JSON.stringify(report,null,2));
   const image=await fs.readFile(path.join(out,name+'-check.jpg'));
   console.log('FRAME_'+name+'_BEGIN');console.log(image.toString('base64'));console.log('FRAME_'+name+'_END');
   const buffer=await fs.readFile(video);
   console.log('VIDEO_'+name+'.mp4_BEGIN');for(let i=0;i<buffer.length;i+=45000)console.log(buffer.subarray(i,i+45000).toString('base64'));console.log('VIDEO_'+name+'.mp4_END');
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
