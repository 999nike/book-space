import assert from "node:assert/strict";
import { createVideoController, getPlaybackSources, HOSTED_VIDEO_URL, TEST_VIDEO_FALLBACK } from "./src/components/video-controller.js";
import { BOOK_SHEETS, getPageContent, getSpreadVideo, isBookOpen } from "./src/components/page-content.js";
const surfaces=Array.from({length:BOOK_SHEETS},(_,number)=>getPageContent(number,BOOK_SHEETS));
const kinds=surfaces.flatMap(surface=>[surface.front,surface.back]);
assert.equal(kinds.filter(kind=>kind==="cover").length,2,"both branded covers remain static");
assert.equal(kinds.filter(kind=>kind==="index").length,1,"exactly one index face");
assert.equal(kinds.filter(kind=>kind==="video").length,17,"every other inside face plays video");
assert.equal(surfaces.at(-1).front,"index","index is the final inside face");
assert.equal(surfaces.at(-2).back,"video","video faces the final index");
assert.match(getSpreadVideo(1).url,/\/startscreenlvl1\.mp4$/);
assert.match(getSpreadVideo(2).url,/\/junkz-landing\.mp4$/);
assert.match(getSpreadVideo(3).url,/\/smokey-space\.mp4$/);
assert.match(getSpreadVideo(4).url,/\/universal-space\.mp4$/);
assert.match(getSpreadVideo(5).url,/\/map%20hangar\.mp4$/);
assert.match(getSpreadVideo(6).url,/\/scorpianboss\.mp4$/);
assert.match(getSpreadVideo(7).url,/\/m1boss\.mp4$/);
assert.match(getSpreadVideo(8).url,/\/m7\.mp4$/);
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
assert.equal(video.src,TEST_VIDEO_FALLBACK);
await Promise.resolve();
assert.equal(video.paused,false);
video.readyState=4;video.fire("loadedmetadata");video.fire("loadeddata");
assert.equal(ready.at(-1),true);
assert.deepEqual([texture.repeat.x,texture.repeat.y,texture.offset.x,texture.offset.y],[1,1,0,0],"full landscape frame remains visible");
video.videoWidth=1024;video.videoHeight=1368;video.fire("loadedmetadata");
assert.deepEqual([texture.repeat.x,texture.repeat.y,texture.offset.x,texture.offset.y],[1,1,0,0],"full portrait frame remains visible, including top and bottom");
assert.equal(video.loads,1,"full-frame mapping never reloads the stream");
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
video.readyState=0;video.fire("error");assert.equal(video.src,HOSTED_VIDEO_URL,"failed same-origin playback can try the direct media origin");
video.fire("error");assert.equal(states.at(-1),"error");
controller.retry();assert.equal(video.src,TEST_VIDEO_FALLBACK);
controller.dispose();assert.equal(texture.disposed,true);assert.equal(video.removed,true);assert.equal(video.events.size,0);
assert.equal(video.src,undefined);
for(const page of [1,2,3,4,5,6,7,8]){
  const clip=getSpreadVideo(page), sources=getPlaybackSources(clip), element=new FakeVideo();
  assert.equal(sources.url,clip.fallback,"known working same-origin route loads first");
  const map={repeat:vector(),offset:vector(),dispose(){}};
  const clipStates=[];
  const player=createVideoController(element,map,value=>clipStates.push(value),()=>{},sources);
  assert.equal(element.src,undefined);
  player.update({active:true});assert.equal(element.src,sources.url);
  element.fire("error");assert.equal(element.src,sources.fallback);
  element.fire("error");assert.equal(element.src,clip.backup,"missing project clips retain the star preview");
  element.fire("playing");assert.equal(clipStates.at(-1),"placeholder");
  player.retry();assert.equal(element.src,sources.url,"Retry checks the installed project file again");
  player.dispose();
}
console.log("PASS: pages 1–8 sources, server fallbacks and Retry; 17 video faces, final index, unchanged covers, one shared stream, playback, page/tab pause, fallback, retry, cleanup.");
