const fs=require('node:fs/promises');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('https://book-space-gold.vercel.app/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Cover',exact:true}).waitFor();
  for(const number of [1,2,4]){
   await page.getByRole('button',{name:'Page '+number,exact:true}).click();
   await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.readyState>=2&&!v.paused&&v.currentTime>0;},null,{polling:100,timeout:45000});
   await page.getByRole('button',{name:'Pause',exact:true}).click();
   await page.waitForTimeout(2000);
   if(errors.length)throw Error(errors.join('; '));
   const image=await page.screenshot({type:'jpeg',quality:70,timeout:30000});
   await fs.writeFile('quick-page-'+number+'.jpg',image);
   console.log('FRAME_page'+number+'_BEGIN');console.log(image.toString('base64'));console.log('FRAME_page'+number+'_END');
   console.log('PAGE_OK '+number);
   if(number===2){
    const popupPromise=page.waitForEvent('popup',{timeout:15000});
    await page.mouse.click(745,450);
    const popup=await popupPromise;
    await popup.waitForURL('https://junkz-shooter-landing.vercel.app/',{timeout:20000});
    await popup.close();
    if(await page.getByRole('button',{name:'Page 2',exact:true}).getAttribute('aria-current')!=='page')throw Error('Preview click turned the page');
    console.log('PREVIEW_CLICK_OK');
   }
   if(number===4&&await page.getByRole('link',{name:'Visit site'}).count())throw Error('Info page must not have a website link');
  }
  if(errors.length)throw Error(errors.join('; '));
  console.log('QUICK_RESULT '+JSON.stringify({pages:[1,2,4],previewClick:true,infoPage:true,errors}));
 }catch(error){console.error('PAGE_ERRORS '+JSON.stringify(errors));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
