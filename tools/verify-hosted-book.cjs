const fs=require('node:fs/promises');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage(),errors=[],requests=[];
 const clips=[
  ['startscreenlvl1','startscreenlvl1.mp4'],['junkz-landing','junkz-landing.mp4'],
  ['smokey-space','smokey-space.mp4'],['universal-space','universal-space.mp4'],
  ['map-hangar','map hangar.mp4'],['scorpianboss','scorpianboss.mp4'],
  ['m1boss','m1boss.mp4'],['m7','m7.mp4']
 ];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().includes('/test-media/'))requests.push(r.url());});
 try{
  for(const [id,file] of clips){
   for(const url of ['https://media.w-i-z-z-lab-studios.com/'+encodeURIComponent(file),'https://book-space-gold.vercel.app/test-media/'+id+'.mp4']){
    const response=await fetch(url,{headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(25000)});
    const bytes=(await response.arrayBuffer()).byteLength;
    if(response.status!==206||!response.headers.get('content-type')?.includes('video/mp4')||bytes!==1024)throw Error('Video range check failed '+url+' '+response.status+' '+bytes);
    console.log('MEDIA_RANGE '+JSON.stringify({url,status:response.status,bytes}));
   }
  }
  await page.goto('https://book-space-gold.vercel.app/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'Page 7',exact:true}).waitFor();
  await page.waitForTimeout(4000);
  const results=[];
  const waitForClip=async id=>{
   await page.waitForFunction(id=>{
    const v=document.querySelector('video');
    return document.querySelectorAll('video').length===1&&v.currentSrc.includes('/'+id+'.mp4')&&v.readyState>=2&&!v.paused;
   },id,{timeout:60000,polling:100});
   return page.locator('video').evaluate(v=>({source:v.currentSrc,width:v.videoWidth,height:v.videoHeight,duration:v.duration,ready:v.readyState,time:v.currentTime,paused:v.paused,loop:v.loop}));
  };
  await page.getByRole('button',{name:'Page 1',exact:true}).click();
  const playlist=['startscreenlvl1','m1boss','m7','scorpianboss','map-hangar'];
  const playlistResults=[];
  for(const [index,id] of playlist.entries()){
   const state=await waitForClip(id);
   if(state.loop)throw Error('Playlist clips must advance on ended');
   const link=await page.locator('.video-controls a').getAttribute('href');
   const file=id==='map-hangar'?'map%20hangar':id;
   if(!link.endsWith('/'+file+'.mp4'))throw Error('Open clip link is out of date');
   playlistResults.push({id,...state});
   console.log('PLAYLIST_CLIP '+JSON.stringify(playlistResults.at(-1)));
   await page.locator('video').evaluate(async v=>{v.currentTime=v.duration-0.2;await v.play();});
   await waitForClip(playlist[(index+1)%playlist.length]);
  }
  for(const number of [1,2,3,4]){
   await page.getByRole('button',{name:'Page '+number,exact:true}).click();
   const state=await waitForClip(clips[number-1][0]);
   if(number===4&&(state.duration<90||!state.loop))throw Error('Universal Space must loop the entire original');
   const initial=await page.locator('video').evaluate(v=>({time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames}));
   await page.waitForFunction(initial=>{
    const v=document.querySelector('video');
    return !v.paused&&(v.currentTime!==initial.time||v.getVideoPlaybackQuality().totalVideoFrames>initial.frames);
   },initial,{polling:100,timeout:30000});
   results.push({page:number,...state});
   console.log('PAGE_PLAYBACK '+JSON.stringify(results.at(-1)));
   if(number===1||number===4){
    const image=await page.screenshot({type:'jpeg',quality:75,timeout:60000});
    await fs.writeFile('book-page-'+number+'.jpg',image);
    console.log('FRAME_page'+number+'_BEGIN');console.log(image.toString('base64'));console.log('FRAME_page'+number+'_END');
   }
  }
  requests.length=0;
  await page.getByRole('button',{name:'Page 1',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('video')?.currentSrc.includes('/startscreenlvl1.mp4')&&document.querySelector('video')?.readyState>=2);
  await page.waitForTimeout(1200);
  if(requests.some(url=>!url.includes('/startscreenlvl1.mp4')))throw Error('Jumping pages should not fetch intermediate clips: '+JSON.stringify(requests));
  await page.getByRole('button',{name:'Index',exact:true}).click();
  await page.getByRole('complementary',{name:'Project index'}).waitFor();
  if(await page.locator('.project-index a').count()!==3)throw Error('Index links missing');
  await page.getByRole('button',{name:'Back Cover',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('video')?.paused===true);
  if(errors.length)throw Error(errors.join('; '));
  const report={results,playlistResults,playlistLoops:true,indexLinks:3,backCoverPaused:true,oneDecoder:true,noIntermediateClipDownloads:true,pageErrors:errors};
  await fs.writeFile('book-playback-report.json',JSON.stringify(report,null,2));
  console.log('BOOK_RESULT '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
