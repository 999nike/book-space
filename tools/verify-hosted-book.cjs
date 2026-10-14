const fs=require('node:fs/promises');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage(), errors=[];
 const clipIds=['junkz-game','junkz-landing','smokey-space'];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const id of clipIds){
   for(const base of ['https://media.w-i-z-z-lab-studios.com/','https://book-space-gold.vercel.app/test-media/']){
    const response=await fetch(base+id+'.mp4',{headers:{Range:'bytes=0-1023'},signal:AbortSignal.timeout(20000)});
    const bytes=(await response.arrayBuffer()).byteLength;
    if(response.status!==206||!response.headers.get('content-type')?.includes('video/mp4')||bytes!==1024)throw Error('Video range check failed '+base+id+' '+response.status+' '+bytes);
    console.log('MEDIA_RANGE '+JSON.stringify({url:base+id+'.mp4',status:response.status,bytes}));
   }
  }
  await page.goto('https://book-space-gold.vercel.app/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'Cover',exact:true}).waitFor();
  await page.waitForTimeout(5000);
  const results=[];
  for(const number of [1,2,3]){
   await page.getByRole('button',{name:'Page '+number,exact:true}).click();
   await page.waitForFunction(id=>document.querySelectorAll('video').length===1&&document.querySelector('video').currentSrc.includes('/'+id+'.mp4')&&document.querySelector('video').readyState>=2&&!document.querySelector('video').paused&&document.querySelector('video').currentTime>0,clipIds[number-1],{timeout:60000});
   await page.waitForTimeout(1500);
   const state=await page.evaluate(()=>({videos:document.querySelectorAll('video').length,source:document.querySelector('video').currentSrc,label:document.querySelector('.video-controls [role=status]')?.textContent,ready:document.querySelector('video').readyState}));
   results.push({page:number,...state});
   if(state.videos!==1)throw Error('Expected one decoder');
   if(!state.source.includes('/'+clipIds[number-1]+'.mp4')||state.label==='Star preview')throw Error('Wrong clip on page '+number);
   if(number===2)await page.screenshot({path:'book-preview-check.png'});
   if(number===3){const image=await page.screenshot({type:'jpeg',quality:65});console.log('FRAME_spread_BEGIN');console.log(image.toString('base64'));console.log('FRAME_spread_END');}
  }
  await page.getByRole('button',{name:'Index',exact:true}).click();
  await page.getByRole('complementary',{name:'Project index'}).waitFor();
  const indexLinks=await page.locator('.project-index a').count();
  if(indexLinks!==3)throw Error('Index links missing');
  await page.getByRole('button',{name:'Back Cover',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('video')?.paused===true);
  if(errors.length)throw Error(errors.join('; '));
  const report={results,indexLinks,backCoverPaused:true,pageErrors:errors};
  await fs.writeFile('book-playback-report.json',JSON.stringify(report,null,2));
  console.log('BOOK_RESULT '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
