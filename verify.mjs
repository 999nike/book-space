import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { projects } from './dist/projects.js';
let videoDraws=0;
const noop=()=>{};
const ctx=new Proxy({measureText:s=>({width:s.length*7}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),drawImage:source=>{if(source.tagName==='VIDEO')videoDraws++;}}, {get:(t,p)=>t[p]||noop,set:(t,p,v)=>{t[p]=v;return true;}});
class Element {
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.dataset={};this.style={};this.hidden=false;this.disabled=false;this.classList={add:noop,remove:noop,toggle:noop};this.paused=true;this.readyState=0;this.videoWidth=1280;this.videoHeight=720;this.files=[];}
 append(v){v.parent?.children.splice(v.parent.children.indexOf(v),1);this.children.push(v);v.parent=this;}
 addEventListener(e,f){(this.events[e]??=[]).push(f);}
 fire(e,extra={}){for(const f of this.events[e]||[])f({target:this,...extra});}
 getContext(){return ctx;}
 setAttribute(k,v){this[k]=v;}
 removeAttribute(k){delete this[k];}
 replaceChildren(){this.children=[];}
 remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);}
 async play(){this.paused=false;this.fire('play');}
 pause(){if(!this.paused){this.paused=true;this.fire('pause');}}
 load(){}
 click(){this.fire('click');}
 showModal(){this.open=true;}
 close(){this.open=false;this.fire('close');}
 getBoundingClientRect(){return {left:0,top:0,right:1000,bottom:500,width:1000,height:500};}
}
const elements=new Map();const doc=new Element();doc.hidden=false;doc.activeElement=null;doc.getElementById=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};doc.createElement=tag=>new Element(tag);
const sandbox={document:doc,matchMedia:()=>({matches:true}),requestAnimationFrame:noop,setTimeout:fn=>fn(),console,performance:{now:()=>0},URL:{createObjectURL:()=> 'blob:local-video',revokeObjectURL:noop},window:new Element(),devicePixelRatio:1};
const source=(await fs.readFile('dist/app.js','utf8')).replace("import { projects } from './projects.js';",'const projects='+JSON.stringify(projects)+';').replace('void startThree();','fallback();');
vm.runInNewContext(source+';globalThis.testBook={goTo,paintPages,media,projects,current:()=>current};',sandbox);
const book=sandbox.testBook,el=id=>doc.getElementById(id);
assert.equal(el('chapters').children.length,3);
assert.equal(el('project-title').textContent,'Space Junkz');
assert.equal(el('watch').disabled,true);
assert.equal(el('fallback').hidden,false);
book.goTo(1);assert.equal(el('project-title').textContent,'Smokey Space');assert.equal(el('visit').href,'https://smokey-space.vercel.app/');assert.equal(el('landing').hidden,true);
book.goTo(2);assert.equal(el('visit').hidden,true);assert.equal(el('next').disabled,true);
book.goTo(7);assert.equal(book.current(),2);
book.goTo(0);assert.equal(el('prev').disabled,true);assert.equal(el('landing').href,'https://junkz-shooter-landing.vercel.app/');
doc.fire('keydown',{key:'ArrowRight',preventDefault:noop});assert.equal(book.current(),1);
book.goTo(0);el('video-file').files=[{name:'junkz.webm'}];el('video-file').fire('change');const video=book.media.get('junkz');assert.ok(video);assert.equal(video.src,'blob:local-video');video.readyState=4;video.fire('loadeddata');await Promise.resolve();assert.equal(el('watch').disabled,false);
book.paintPages(1);assert.ok(videoDraws>0,'Actual video frames reach fallback page');
el('play').click();assert.equal(video.paused,true);el('play').click();await Promise.resolve();assert.equal(video.paused,false);
el('sound').click();assert.equal(video.muted,false);
el('watch').click();assert.equal(el('viewer').open,true);assert.equal(video.controls,true);el('close-viewer').click();assert.equal(video.controls,false);
book.goTo(1);assert.equal(video.paused,true);assert.equal(el('watch').disabled,true);
console.log('PASS: chapters, boundaries, keyboard navigation, project URLs, local video attachment, frame drawing, play/pause, sound, modal, hidden media.');
