import { projects } from './projects.js';
const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0, paused = false, muted = true, turning = false;
let engine = null, lastPaint = 0, demoTime = 0, priorFrame = 0, painted = false;
const media = new Map(), localUrls = new Map();
const pageCanvases = [];
const W = 2.3, H = 3.24;
const dialog = $('viewer');
let dialogVideo = null;
let pointerStart = null;

function makeCanvas() { const c=document.createElement('canvas'); c.width=768;c.height=1080;return c; }
for(let n=0;n<4;n++) pageCanvases.push({front:makeCanvas(),back:makeCanvas()});
function text(ctx, str, x, y, size=20, color='#263328', font='Arial', weight='400') {
 ctx.fillStyle=color;ctx.font=weight+' '+size+'px '+font;ctx.fillText(str,x,y);
}
function tracked(ctx,str,x,y,size=13,color='#777e69',spacing=3) {
 ctx.font='500 '+size+'px Arial';ctx.fillStyle=color;for(const char of str){ctx.fillText(char,x,y);x+=ctx.measureText(char).width+spacing;}
}
function line(ctx,x,y,x2,y2,color='#d2cfbf'){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function base(c,number,label) {
 const ctx=c.getContext('2d');ctx.fillStyle='#f5f1e5';ctx.fillRect(0,0,768,1080);
 tracked(ctx,'THE PROJECT BOOK',57,57,13,'#526149',2);
 tracked(ctx,label,57,1005,11,'#68735c',2);
 text(ctx,String(number).padStart(2,'0'),685,1005,14,'#68735c');
 line(ctx,57,79,711,79);line(ctx,57,968,711,968);
 return ctx;
}
function drawSpace(ctx,x,y,w,h,time,p,landing=false) {
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,p.kind==='smoke'?'#291d36':'#101d1c');g.addColorStop(1,p.kind==='smoke'?'#101923':'#071310');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
 for(let i=0;i<85;i++){
  const sx=x+((i*179.7+Math.sin(i)*34)%w+w)%w;
  const sy=y+((i*83.37+time*(i%3+1)*14)%h+h)%h;
  const a=.18+(Math.sin(time*.7+i)*.5+.5)*.5;
  ctx.fillStyle='rgba(233,247,216,'+a+')';ctx.fillRect(sx,sy,i%8===0?2:1,i%8===0?2:1);
 }
 if(p.kind==='arcade'){
  for(let i=0;i<8;i++){
   const ax=x+((i*112+time*12)%w),ay=y+((i*97+time*25)%h);
   ctx.save();ctx.translate(ax,ay);ctx.rotate(time*.15+i);ctx.strokeStyle='#727f56';ctx.lineWidth=2;ctx.beginPath();
   for(let j=0;j<7;j++){const a=j*Math.PI*2/7,r=16+(j%3)*5;const px=Math.cos(a)*r,py=Math.sin(a)*r;j?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.stroke();ctx.restore();
  }
  const px=x+w*.5+Math.sin(time*.8)*w*.1,py=y+h*.65;
  const glow=ctx.createRadialGradient(px,py,0,px,py,70);glow.addColorStop(0,'#b6ef6a28');glow.addColorStop(1,'#b6ef6a00');ctx.fillStyle=glow;ctx.fillRect(px-70,py-70,140,140);
  ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(px,py-34);ctx.lineTo(px+19,py+20);ctx.lineTo(px,py+11);ctx.lineTo(px-19,py+20);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e3f6ab';ctx.fillRect(px-2,py-60-((time*80)%120),4,15);
  ctx.fillStyle='#88b853';ctx.beginPath();ctx.moveTo(px-7,py+21);ctx.lineTo(px,py+45+Math.sin(time*20)*5);ctx.lineTo(px+7,py+21);ctx.fill();
  if(landing){text(ctx,'SPACE',x+30,y+75,26,'#e6f1d4');text(ctx,'JUNKZ',x+28,y+156,84,p.accent,'Georgia','700');tracked(ctx,'A LITTLE CHAOS. A LOT OF SPACE.',x+30,y+188,10,'#c0c6ad',1);}
 }else if(p.kind==='smoke'){
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<5;i++){
   const cx=x+w*.5+Math.sin(time*.2+i)*w*.2,cy=y+h*.5+Math.cos(time*.13+i)*h*.2;
   const g=ctx.createRadialGradient(cx,cy,0,cx,cy,w*.35);g.addColorStop(0,i%2?'#8c67af35':'#498a9735');g.addColorStop(1,'#78569500');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  }
  ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#dbbaf4';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.5,95,43,-.5,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#e7d3f0';ctx.beginPath();ctx.arc(x+w*.5,y+h*.5,18,0,Math.PI*2);ctx.fill();
  if(landing){text(ctx,'Smokey',x+30,y+83,64,'#e0c9f2','Georgia');text(ctx,'Space',x+30,y+153,64,'#e0c9f2','Georgia');}
 }else{
  ctx.strokeStyle='#66725d';ctx.setLineDash([4,8]);ctx.beginPath();ctx.arc(x+w/2,y+h/2,65,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  text(ctx,'+',x+w/2-15,y+h/2+16,53,p.accent,'Georgia');
 }
 ctx.restore();
}
function videoPage(c,p,i,time) {
 const ctx=base(c,i*2+1,'FIELD NOTES / '+p.category);
 tracked(ctx,p.eyebrow,57,130,12,'#687456',2);
 text(ctx,p.pageTitle,49,235,104,'#263328','Georgia');
 text(ctx,p.subtitle,58,271,23,'#6c7e57','Georgia');
 drawSpace(ctx,57,311,654,400,time,p);
 const v=media.get(p.id);
 ctx.fillStyle='#283629';ctx.fillRect(57,711,654,48);
 text(ctx,v?(v.paused?'Ⅱ':'▶'):'✳',75,742,15,p.accent);
 tracked(ctx,v?'GAMEPLAY / VIDEO':'ANIMATED CONCEPT / VIDEO SLOT',108,741,10,'#dde3d0',1.7);
 text(ctx,muted?'SOUND OFF':'SOUND ON',605,741,10,'#b9c4a8');
 text(ctx,p.description,57,824,30,'#34452e','Georgia');
 text(ctx,i===2?'The collection continues here.':'A window into the project.',57,870,17,'#757d69');
 text(ctx,v?'Use the controls below to watch, pause, or hear it.':'Add a gameplay clip to bring this page to life.',57,899,17,'#757d69');
}
function detailPage(c,p,i,time){
 const ctx=base(c,i*2+2,'EXPLORE / '+p.title.toUpperCase());
 tracked(ctx,i===0?'THE LANDING EXPERIENCE':'THE NEXT WORLD',57,131,12,'#687456',2);
 text(ctx,i===0?'Meet Junkz.':i===1?'Smokey Space.':'Keep exploring.',53,230,i===1?66:80,'#263328','Georgia');
 text(ctx,i===0?'The world behind the game.':i===1?'A different atmosphere.':'Good things are still ahead.',58,273,23,'#6c7e57','Georgia');
 drawSpace(ctx,57,321,654,364,time*.6,p,true);
 ctx.strokeStyle=p.accent;ctx.lineWidth=1;ctx.strokeRect(88,602,182,45);text(ctx,i===0?'ENTER THE WORLD  ↗':i===1?'EXPLORE SPACE  ↗':'COMING NEXT',103,631,12,p.accent);
 tracked(ctx,i===0?'GAME + LANDING PAGE':i===1?'WEB EXPERIENCE':'ROOM FOR MORE',57,745,12,'#647451',2);
 text(ctx,i===0?'One project. Two ways in.':i===1?'A new corner of the universe.':'Something worth turning for.',57,804,28,'#34452e','Georgia');
 const copy=i===0?['Jump straight into Space Junkz, or explore','its landing page before you play.']:i===1?['Open Smokey Space and take a look around.','Its own chapter, its own little world.']:['Future games and webpages belong here.','The book grows with the collection.'];
 text(ctx,copy[0],57,852,18,'#757d69');text(ctx,copy[1],57,880,18,'#757d69');
 text(ctx,i===0?'LANDING PAGE ↗':i===1?'VISIT PROJECT ↗':'TO BE CONTINUED',57,934,15,'#344c2c','Arial','700');
}
function cover(c,end=false){const ctx=c.getContext('2d');ctx.fillStyle='#28372a';ctx.fillRect(0,0,768,1080);tracked(ctx,'THE DIGITAL EDITION',65,86,14,'#bdcc9f',3);text(ctx,end?'More':'Small',60,366,114,'#d4e9b2','Georgia');text(ctx,end?'worlds':'worlds.',60,484,114,'#d4e9b2','Georgia');text(ctx,end?'await.':'Big ideas.',60,602,100,'#d4e9b2','Georgia');text(ctx,'✳',59,840,112,'#b6d48e');tracked(ctx,'THE PROJECT BOOK / VOL. 01',65,986,13,'#bdcc9f',2);}
function paintPages(time){
 const changed=[];
 if(!painted){cover(pageCanvases[0].front);cover(pageCanvases[3].back,true);changed.push(pageCanvases[0].front,pageCanvases[3].back);}
 projects.forEach((p,i)=>{if(!painted||i===current||turning){videoPage(pageCanvases[i].back,p,i,time);detailPage(pageCanvases[i+1].front,p,i,time);changed.push(pageCanvases[i].back,pageCanvases[i+1].front);}});painted=true;
 const left=$('left-canvas').getContext('2d');left.drawImage(pageCanvases[current].back,0,0);
 const right=$('right-canvas').getContext('2d');right.drawImage(pageCanvases[current+1].front,0,0);
 const v=media.get(projects[current].id);
 if(v&&v.readyState>=2){try{drawVideoCover(left,v,57,311,654,400);}catch{}}
 if(engine)engine.textures.forEach(t=>{if(changed.includes(t.image))t.needsUpdate=true;});
}
function drawVideoCover(ctx,v,x,y,w,h){const ratio=Math.max(w/v.videoWidth,h/v.videoHeight);const sw=w/ratio,sh=h/ratio;ctx.drawImage(v,(v.videoWidth-sw)/2,(v.videoHeight-sh)/2,sw,sh,x,y,w,h);}
function setStatus(message){$('media-status').textContent=message;}
async function tryPlay(v){try{await v.play();paused=false;syncControls();return true;}catch{paused=true;syncControls();setStatus('Video ready · press Play to start.');return false;}}
function syncControls(){
 const p=projects[current],v=media.get(p.id);
 for(const id of ['play','sound','watch'])$(id).disabled=!v;
 $('play').textContent=paused?'▶':'Ⅱ';$('play').ariaLabel=paused?'Play video':'Pause video';$('play').title=$('play').ariaLabel;
 $('sound').textContent=muted?'♫':'♪';$('sound').ariaLabel=muted?'Enable sound':'Mute sound';$('sound').title=$('sound').ariaLabel;
 $('sound').setAttribute('aria-pressed',String(!muted));
 if(v)v.muted=muted;
}
function syncChapter(){
 const p=projects[current];$('project-num').textContent=String(current+1).padStart(2,'0');$('project-title').textContent=p.title;$('project-category').textContent=p.category;
 $('visit').hidden=!p.url;$('visit').href=p.url||'#';$('visit').innerHTML=(current===0?'Play the game':'Visit project')+' <span>↗</span>';
 $('landing').hidden=!p.landing;$('landing').href=p.landing||'#';
 $('prev').disabled=current===0;$('next').disabled=current===projects.length-1;
 for(const button of $('chapters').children)button.setAttribute('aria-current',String(Number(button.dataset.index)===current));
 const active=media.get(p.id);for(const [id,v] of media){if(v===active&&!document.hidden&&!paused)void tryPlay(v);else v.pause();}
 syncControls();setStatus(active?(localUrls.has(p.id)?'Local video preview · stays on this device.':'Gameplay video · muted autoplay.'):'Animated concept preview · your gameplay video goes here.');
 if(engine)engine.fitVideo(current);
 paintPages(demoTime);
}
function goTo(index){
 if(index<0||index>=projects.length||index===current||turning)return;
 current=index;paused=false;muted=true;turning=!reduced;
 $('showroom').classList.toggle('is-busy',turning);syncChapter();
 if(!engine&&!reduced){$('fallback').classList.remove('turning');void $('fallback').offsetWidth;$('fallback').classList.add('turning');}
 setTimeout(()=>{turning=false;$('showroom').classList.remove('is-busy');},reduced?0:950);
}
projects.forEach((p,i)=>{const b=document.createElement('button');b.className='chapter';b.dataset.index=i;b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span> '+p.chapter;b.addEventListener('click',()=>goTo(i));$('chapters').append(b);});
$('prev').addEventListener('click',()=>goTo(current-1));$('next').addEventListener('click',()=>goTo(current+1));
document.addEventListener('keydown',e=>{if(dialog.open||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();goTo(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();goTo(current-1);}});
$('showroom').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;pointerStart={x:e.clientX,y:e.clientY,time:performance.now()};});
$('showroom').addEventListener('pointerup',e=>{if(!pointerStart||e.target.closest('button'))return;const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;const rect=$('showroom').getBoundingClientRect();if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))goTo(current+(dx<0?1:-1));else if(Math.abs(dx)<8&&Math.abs(dy)<8){const x=(e.clientX-rect.left)/rect.width;if(x<.37)goTo(current-1);if(x>.63)goTo(current+1);}pointerStart=null;});
$('showroom').addEventListener('pointercancel',()=>pointerStart=null);
$('play').addEventListener('click',()=>{const v=media.get(projects[current].id);if(!v)return;if(v.paused)void tryPlay(v);else{v.pause();paused=true;syncControls();}});
$('sound').addEventListener('click',()=>{muted=!muted;syncControls();});
function openDialog(title,label){$('viewer-title').textContent=title;$('viewer-label').textContent=label;$('viewer-content').replaceChildren();$('viewer-note').textContent='';dialog.showModal();}
function closeDialog(){dialog.close();}
$('close-viewer').addEventListener('click',closeDialog);
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog();});
dialog.addEventListener('close',()=>{if(dialogVideo){dialogVideo.controls=false;$('media-bin').append(dialogVideo);dialogVideo=null;}syncControls();});
$('watch').addEventListener('click',()=>{const p=projects[current],v=media.get(p.id);if(!v)return;openDialog(p.title,'GAMEPLAY / VIDEO');v.controls=true;dialogVideo=v;$('viewer-content').append(v);$('viewer-note').textContent='Use the player controls for sound, seeking, and fullscreen.';});
$('index-button').addEventListener('click',()=>{openDialog('The collection','VOL. 01 / THREE CHAPTERS');const list=document.createElement('div');list.className='collection-list';projects.forEach((p,i)=>{const b=document.createElement('button');b.innerHTML='<small>'+String(i+1).padStart(2,'0')+'</small><div><strong>'+p.title+'</strong><small>'+p.category+'</small></div><span>↗</span>';b.addEventListener('click',()=>{closeDialog();goTo(i);});list.append(b);});$('viewer-content').append(list);});
function addMedia(p,src){
 const old=media.get(p.id);if(old){old.pause();old.removeAttribute('src');old.load();old.remove();}
 const v=document.createElement('video');v.crossOrigin='anonymous';v.muted=true;v.loop=true;v.playsInline=true;v.preload='metadata';v.src=src;v.setAttribute('aria-label',p.title+' gameplay');
 media.set(p.id,v);$('media-bin').append(v);
 v.addEventListener('error',()=>{if(projects[current].id===p.id){paused=true;syncControls();setStatus('This video could not load. Try an MP4 or WebM clip.');}});
 v.addEventListener('loadeddata',()=>{if(engine)engine.fitVideo(current);if(projects[current].id===p.id){paused=false;muted=true;syncChapter();}});
 v.addEventListener('play',()=>{if(projects[current].id===p.id){paused=false;syncControls();}});
 v.addEventListener('pause',()=>{if(projects[current].id===p.id){paused=true;syncControls();}});
 v.load();if(projects[current].id===p.id){paused=false;muted=true;syncChapter();}
}
$('add-video').addEventListener('click',()=>$('video-file').click());
$('video-file').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const p=projects[current];const previous=localUrls.get(p.id);const src=URL.createObjectURL(file);localUrls.set(p.id,src);addMedia(p,src);if(previous)URL.revokeObjectURL(previous);e.target.value='';});
projects.forEach(p=>{if(p.video)addMedia(p,p.video);});
let resumeOnVisible = false;
document.addEventListener('visibilitychange',()=>{if(document.hidden){resumeOnVisible=!paused;for(const v of media.values())v.pause();}else{paused=!resumeOnVisible;syncChapter();}});
window.addEventListener('pagehide',()=>{for(const v of media.values())v.pause();for(const url of localUrls.values())URL.revokeObjectURL(url);});
function fallback(){if(engine)return;$('loading').hidden=true;$('fallback').hidden=false;$('scene').hidden=true;paintPages(demoTime);}
setTimeout(fallback,6500);
function frame(now){const dt=Math.min((now-priorFrame)/1000,.05);priorFrame=now;if(!document.hidden){if(!reduced&&!paused)demoTime+=dt;if(now-lastPaint>1000/24){paintPages(demoTime);lastPaint=now;}if(engine)engine.render(dt,now);}requestAnimationFrame(frame);}
syncChapter();requestAnimationFrame(frame);

async function startThree(){
 let T;try{T=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');}catch{fallback();return;}
 try{
 const container=$('scene');const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0xeeeae1,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 container.append(renderer.domElement);
 const scene=new T.Scene();const camera=new T.PerspectiveCamera(39,1,.1,100);camera.position.set(0,1.55,7.2);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xfff9e9,0x858d73,3));
 const light=new T.DirectionalLight(0xfff6dc,3.1);light.position.set(-3,5,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-6;light.shadow.camera.right=6;light.shadow.camera.top=6;light.shadow.camera.bottom=-6;light.shadow.normalBias=.02;light.shadow.bias=-.0001;scene.add(light);
 const fill=new T.DirectionalLight(0xc5ddc8,1.1);fill.position.set(4,-1,3);scene.add(fill);
 const book=new T.Group();book.rotation.set(-.29,.045,-.035);scene.add(book);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.14}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.87;floor.receiveShadow=true;scene.add(floor);
 const backBoard=new T.Mesh(new T.BoxGeometry(W*2+.12,H+.12,.045),new T.MeshStandardMaterial({color:0x34442e,roughness:.72}));backBoard.position.set(0,0,-.075);backBoard.receiveShadow=true;backBoard.castShadow=true;book.add(backBoard);
 const pageStack=new T.Mesh(new T.BoxGeometry(W*2-.025,H-.025,.09),new T.MeshStandardMaterial({color:0xddd8c9,roughness:.95}));pageStack.position.z=-.026;pageStack.receiveShadow=true;book.add(pageStack);
 const spine=new T.Mesh(new T.BoxGeometry(.035,H+.04,.11),new T.MeshStandardMaterial({color:0x8a927b,roughness:1}));spine.position.z=-.025;book.add(spine);
 const textures=[],leaves=[],videoMeshes=new Map();
 const edgeMaterial=new T.MeshStandardMaterial({color:0xe5dfce,roughness:.85});
 function texture(canvas){const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;}
 for(let i=0;i<4;i++){
  const pivot=new T.Group();pivot.position.z=-i*.014+.056;pivot.rotation.y=i<=current?-Math.PI:0;book.add(pivot);
  const geometry=new T.BoxGeometry(W,H,.007,42,2,1);geometry.translate(W/2,0,0);geometry.userData.original=geometry.attributes.position.array.slice();
  const front=new T.MeshStandardMaterial({map:texture(pageCanvases[i].front),roughness:.76,metalness:0});
  const back=new T.MeshStandardMaterial({map:texture(pageCanvases[i].back),roughness:.76,metalness:0});
  const mesh=new T.Mesh(geometry,[edgeMaterial,edgeMaterial,edgeMaterial,edgeMaterial,front,back]);mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);leaves.push({pivot,geometry,angle:pivot.rotation.y});
 }
 function bend(geometry,amplitude){const original=geometry.userData.original,a=geometry.attributes.position.array;for(let j=0;j<a.length;j+=3){a[j]=original[j];a[j+1]=original[j+1];a[j+2]=original[j+2]+Math.sin(original[j]/W*Math.PI)*amplitude;}geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();}
 function fitVideo(index){
  for(const entry of videoMeshes.values())entry.mesh.visible=false;
  const p=projects[index],v=media.get(p.id);if(!v||v.readyState<2)return;
  let entry=videoMeshes.get(p.id);
  if(entry&&entry.video!==v){entry.mesh.geometry.dispose();entry.mesh.material.dispose();entry.texture.dispose();entry.mesh.removeFromParent();videoMeshes.delete(p.id);entry=null;}
  if(!entry){
   const vt=new T.VideoTexture(v);vt.colorSpace=T.SRGBColorSpace;
   const geometry=new T.PlaneGeometry(W*654/768,H*400/1080,32,2);geometry.translate(W*.5,H*.5-H*511/1080,-.006);
   const uv=geometry.attributes.uv;for(let j=0;j<uv.count;j++)uv.setX(j,1-uv.getX(j));
   const videoAspect=v.videoWidth/v.videoHeight,frameAspect=(W*654/768)/(H*400/1080);for(let j=0;j<uv.count;j++){if(videoAspect>frameAspect)uv.setX(j,.5+(uv.getX(j)-.5)*frameAspect/videoAspect);else uv.setY(j,.5+(uv.getY(j)-.5)*videoAspect/frameAspect);}
   geometry.userData.original=geometry.attributes.position.array.slice();
   const material=new T.MeshBasicMaterial({map:vt,side:T.DoubleSide,toneMapped:false});const mesh=new T.Mesh(geometry,material);leaves[index].pivot.add(mesh);entry={mesh,texture:vt,video:v};videoMeshes.set(p.id,entry);
  }
  entry.mesh.visible=true;
 }
 function resize(){const width=container.clientWidth,height=container.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=width<650?9.0:7.2;camera.fov=width<650?46:39;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(container);resize();
 const render=(dt,now)=>{
  for(let i=0;i<leaves.length;i++){
   const leaf=leaves[i],target=i<=current?-Math.PI:0;leaf.angle=reduced?target:T.MathUtils.damp(leaf.angle,target,7,dt);leaf.pivot.rotation.y=leaf.angle;
   const amount=Math.sin(Math.abs(leaf.angle));const curl=(i<=current?-.017:.017)+amount*.32;
   bend(leaf.geometry,curl);const entry=videoMeshes.get(projects[i]?.id);if(entry?.mesh.visible)bend(entry.mesh.geometry,curl);
  }
  renderer.render(scene,camera);
 };
 engine={textures,fitVideo,render,renderer,scene,camera};$('fallback').hidden=true;$('loading').hidden=true;container.hidden=false;fitVideo(current);
 }catch(error){console.warn('Using the accessible book view:',error.message);engine=null;$('scene').replaceChildren();fallback();}
}
void startThree();
