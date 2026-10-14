import assert from "node:assert/strict";
import { createVideoController, HOSTED_VIDEO_URL, TEST_VIDEO_FALLBACK } from "./src/components/video-controller.js";
import { PAGE_ASPECT, SPREAD_ASPECT } from "./src/components/video-layout.js";
import { BOOK_SHEETS, getPageContent, getSpreadVideo, isBookOpen } from "./src/components/page-content.js";
const surfaces=Array.from({length:BOOK_SHEETS},(_,number)=>getPageContent(number,BOOK_SHEETS));
const kinds=surfaces.flatMap(surface=>[surface.front,surface.back]);
assert.equal(kinds.filter(kind=>kind==="cover").length,2,"both branded covers remain static");
assert.equal(kinds.filter(kind=>kind==="index").length,1,"exactly one index face");
assert.equal(kinds.filter(kind=>kind==="video").length,15,"every other inside face plays video");
assert.equal(surfaces.at(-1).front,"index","index is the final inside face");
assert.equal(surfaces.at(-2).back,"video","video faces the final index");
assert.match(getSpreadVideo(1).url,/\/junkz-game\.mp4$/);
assert.match(getSpreadVideo(2).url,/\/junkz-landing\.mp4$/);
assert.match(getSpreadVideo(3).url,/\/smokey-space\.mp4$/);
assert.equal(getSpreadVideo(4).id,"stars");
class FakeVideo {
  constructor() { this.paused=true;this.readyState=0;this.videoWidth=1920;this.videoHeight=1080;this.events=new Map();this.loads=0;this.plays=0; }
  addEventListener(n,f){this.events.set(n,f);}
  removeEventListener(n,f){if(this.events.get(n)===f)this.events.delete(n);}
  fire(n){this.events.get(n)?.();}
  play(){this.paused=false;this.plays++;this.fire("playing");return Promise.resolve();}
  pause(){if(!this.paused){this.paused=true;this.fire("pause");}}
  load(){this.loads++;}
  removeAttribute(n){delete this[n];}
  remove(){this.removed=true;}
}
const video=new FakeVideo();
const vector=()=>({x:1,y:1,set(x,y){this.x=x;this.y=y;}});
const texture={repeat:vector(),offset:vector(),dispose(){this.disposed=true;}};
const states=[],ready=[];
const controller=createVideoController(video,texture,s=>states.push(s),r=>ready.push(r));
assert.equal(video.src,undefined,"cover does not fetch a video");
controller.update({active:true,visible:true});
assert.equal(video.src,HOSTED_VIDEO_URL);
await Promise.resolve();
assert.equal(video.paused,false);
video.readyState=4;video.fire("loadedmetadata");video.fire("loadeddata");
assert.equal(ready.at(-1),true);
assert.ok(Math.abs(texture.repeat.x-SPREAD_ASPECT/(1920/1080))<0.00001,"crop preserves video aspect");
controller.update({aspect:PAGE_ASPECT});assert.ok(Math.abs(texture.repeat.x-PAGE_ASPECT/(1920/1080))<0.00001,"index-facing video fits one page");
assert.equal(video.loads,1,"layout changes do not restart the stream");
controller.update({aspect:SPREAD_ASPECT});
controller.update({active:false});assert.equal(video.paused,true,"turned pages pause");
controller.update({active:true});assert.equal(video.paused,false,"visible page resumes");
controller.toggle();assert.equal(video.paused,true);
controller.update({visible:false});controller.update({visible:true});assert.equal(video.paused,true,"user pause survives visibility changes");
controller.toggle();assert.equal(video.paused,false);
controller.update({visible:false});assert.equal(video.paused,true,"hidden tab pauses");
controller.update({visible:true});assert.equal(video.paused,false);
for(let spread=1;spread<BOOK_SHEETS;spread++){controller.update({active:isBookOpen(spread,BOOK_SHEETS)});assert.equal(video.paused,false,"video stays playing across spreads");}
assert.equal(video.loads,1,"page turns reuse one stream");
controller.update({active:isBookOpen(BOOK_SHEETS,BOOK_SHEETS)});assert.equal(video.paused,true,"back cover pauses playback");
controller.update({active:isBookOpen(0,BOOK_SHEETS)});assert.equal(video.paused,true,"front cover pauses playback");
controller.update({active:isBookOpen(1,BOOK_SHEETS)});assert.equal(video.loads,1,"reopening resumes without reloading");
video.readyState=0;video.fire("error");assert.equal(video.src,TEST_VIDEO_FALLBACK,"failed cross-origin route uses fixed test proxy");
video.fire("error");assert.equal(states.at(-1),"error");
controller.retry();assert.equal(video.src,HOSTED_VIDEO_URL);
controller.dispose();assert.equal(texture.disposed,true);assert.equal(video.removed,true);assert.equal(video.events.size,0);
assert.equal(video.src,undefined);
for(const page of [1,2,3]){
  const clip=getSpreadVideo(page), element=new FakeVideo();
  const map={repeat:vector(),offset:vector(),dispose(){}};
  const clipStates=[];
  const player=createVideoController(element,map,value=>clipStates.push(value),()=>{},clip);
  assert.equal(element.src,undefined);
  player.update({active:true});assert.equal(element.src,clip.url);
  element.fire("error");assert.equal(element.src,clip.fallback);
  element.fire("error");assert.equal(element.src,clip.backup,"missing project clips retain the star preview");
  element.fire("playing");assert.equal(clipStates.at(-1),"placeholder");
  player.retry();assert.equal(element.src,clip.url,"Retry checks the installed project file again");
  player.dispose();
}
console.log("PASS: pages 1–3 sources, server fallbacks and Retry; 15 video faces, final index, unchanged covers, one shared stream, playback, page/tab pause, fallback, retry, cleanup.");
