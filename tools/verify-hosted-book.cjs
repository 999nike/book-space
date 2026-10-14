const fs=require('node:fs/promises');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1024,height:1368}});
 const page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('https://book-space-gold.vercel.app/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('button',{name:'Cover',exact:true}).waitFor();
  await page.waitForTimeout(5000);
  const results=[];
  for(const number of [1,2,3]){
   await page.getByRole('button',{name:'Page '+number,exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('video').length===1&&document.querySelector('video').readyState>=2&&!document.querySelector('video').paused,{},{timeout:60000});
   await page.waitForTimeout(1500);
   const state=await page.evaluate(()=>({videos:document.querySelectorAll('video').length,source:document.querySelector('video').currentSrc,label:document.querySelector('.video-controls [role=status]')?.textContent,ready:document.querySelector('video').readyState}));
   results.push({page:number,...state});
   if(state.videos!==1)throw Error('Expected one decoder');
   if(number===2)await page.screenshot({path:'book-preview-check.png'});
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
