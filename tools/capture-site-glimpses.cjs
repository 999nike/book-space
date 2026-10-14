const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('/tmp/book-capture/node_modules/playwright');
const output = path.resolve('capture-output');
const sites = [
  {name:'junkz-landing',url:'https://junkz-shooter-landing.vercel.app/'},
  {name:'smokey-space',url:'https://smokey-space.vercel.app/'},
];
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const results=[];
 try {
  for (const site of sites) {
   const context=await browser.newContext({
    viewport:{width:1024,height:1368},deviceScaleFactor:1,
    recordVideo:{dir:path.join(output,'raw'),size:{width:1024,height:1368}},
   });
   const page=await context.newPage();
   const problems=[];
   page.on('pageerror',e=>problems.push(e.message));
   page.on('requestfailed',r=>problems.push(r.url()+': '+r.failure()?.errorText));
   const response=await page.goto(site.url,{waitUntil:'domcontentloaded',timeout:45000});
   if(!response?.ok()) throw new Error(site.name+' returned '+response?.status());
   await page.waitForTimeout(5000);
   await page.evaluate(async()=>{
    await Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,4000))]);
    for(const video of document.querySelectorAll('video')){video.muted=true;video.play().catch(()=>{});}
   });
   const info=await page.evaluate(()=>({
    title:document.title,heading:document.querySelector('h1')?.innerText,
    text:document.body.innerText.slice(0,1500),
    videos:[...document.querySelectorAll('video')].map(v=>({source:v.currentSrc,readyState:v.readyState})),
   }));
   if(/authentication required|log in to vercel|sign in to vercel/i.test(info.title+' '+info.text)) throw new Error('Deployment protection blocked '+site.name);
   await page.screenshot({path:path.join(output,site.name+'-preview.png')});
   await page.waitForTimeout(8200);
   const videoPath=await page.video().path();
   await context.close();
   const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',videoPath]));
   const start=Math.max(0,Number(probe.format.duration)-8.2);
   const mp4=path.join(output,site.name+'.mp4');
   execFileSync('ffmpeg',['-y','-ss',String(start),'-i',videoPath,'-t','8','-an','-vf','fps=25,scale=1024:1368','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['ignore','ignore','pipe']});
   const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',mp4]));
   const stream=metadata.streams.find(s=>s.codec_type==='video');
   const result={name:site.name,url:site.url,...info,bytes:(await fs.stat(mp4)).size,duration:metadata.format.duration,width:stream.width,height:stream.height,codec:stream.codec_name,problems};
   results.push(result);
   console.log('CAPTURE_RESULT '+JSON.stringify(result));
   execFileSync('ffmpeg',['-y','-ss','2','-i',mp4,'-frames:v','1','-vf','scale=384:-2','-q:v','5',path.join(output,site.name+'-check.jpg')],{stdio:['ignore','ignore','pipe']});
   const check=await fs.readFile(path.join(output,site.name+'-check.jpg'));
   console.log('FRAME_'+site.name+'_BEGIN');
   console.log(check.toString('base64'));
   console.log('FRAME_'+site.name+'_END');
  }
  await fs.writeFile(path.join(output,'capture-report.json'),JSON.stringify(results,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
