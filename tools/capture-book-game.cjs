const fs=require('node:fs/promises'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {chromium}=require('/tmp/book-capture/node_modules/playwright');
const out=path.resolve('capture-output');
async function exportFile(file){const b=await fs.readFile(path.join(out,file));console.log('VIDEO_'+file+'_BEGIN');console.log(b.toString('base64'));console.log('VIDEO_'+file+'_END');}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 for(const file of ['junkz-landing.mp4','smokey-space.mp4']) await exportFile(file);
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1024,height:1368},recordVideo:{dir:path.join(out,'raw-game'),size:{width:1024,height:1368}}});
 const page=await context.newPage();
 page.setDefaultTimeout(20000);
 try {
  await page.goto('https://space-junkz-shooter.vercel.app/game.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(5000);
  const skip=page.getByRole('button',{name:'SKIP',exact:true});
  if(await skip.isVisible()) await skip.click();
  await page.locator('#startBtn').waitFor({state:'visible',timeout:30000});
  await page.locator('#startBtn').click();
  await page.waitForTimeout(1200);
  if(await page.locator('#addPlayerBtn').isVisible()){
   await page.locator('#addPlayerBtn').click();
   await page.locator('#newPlayerName').fill('BookPreview');
   await Promise.all([page.waitForEvent('domcontentloaded',{timeout:30000}),page.locator('#savePlayerBtn').click()]);
   await page.waitForTimeout(5000);
   if(await skip.isVisible()) await skip.click();
   await page.locator('#startBtn').waitFor({state:'visible',timeout:30000});
   await page.locator('#startBtn').click();
  }
  await page.waitForFunction(()=>window.GameState?.running&&!window.MainMenu?.active,{},{timeout:30000});
  if(await page.locator('#btnFire').isVisible()) await page.locator('#btnFire').click();
  await page.mouse.move(512,430);
  await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(out,'junkz-game-preview.png')});
  const state=()=>page.evaluate(()=>({running:window.GameState?.running,level:window.GameState?.currentLevel,score:window.GameState?.score,lives:window.GameState?.lives}));
  const before=await state();
  for(const key of ['ArrowLeft','ArrowRight','ArrowRight','ArrowLeft']){
   await page.keyboard.down(key);await page.waitForTimeout(1200);await page.keyboard.up(key);await page.waitForTimeout(800);
  }
  const after=await state();
  await page.waitForTimeout(200);
  const raw=await page.video().path();await context.close();
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',raw]));
  const mp4=path.join(out,'junkz-game.mp4');
  execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,Number(probe.format.duration)-8.2)),'-i',raw,'-t','8','-an','-vf','fps=25,scale=1024:1368','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',mp4],{stdio:['ignore','ignore','pipe']});
  execFileSync('ffmpeg',['-y','-ss','3','-i',mp4,'-frames:v','1','-vf','scale=384:-2','-q:v','5',path.join(out,'junkz-game-check.jpg')],{stdio:['ignore','ignore','pipe']});
  console.log('GAME_RESULT '+JSON.stringify({before,after,bytes:(await fs.stat(mp4)).size}));
  await fs.writeFile(path.join(out,'game-report.json'),JSON.stringify({before,after},null,2));
  console.log('FRAME_junkz-game_BEGIN');console.log((await fs.readFile(path.join(out,'junkz-game-check.jpg'))).toString('base64'));console.log('FRAME_junkz-game_END');
  await exportFile('junkz-game.mp4');
 } catch(e) {
  console.log('GAME_FAILED '+e.stack);
  console.log('GAME_UI '+JSON.stringify(await page.evaluate(()=>({title:document.title,text:document.body.innerText.slice(0,5000)})).catch(()=>({}))));
  await page.screenshot({path:path.join(out,'junkz-game-failure.png')}).catch(()=>{});
  process.exitCode=1;
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
