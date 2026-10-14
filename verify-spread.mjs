import assert from "node:assert/strict";
import { applyVideoPageUVs, fitPageFrame } from "./src/components/video-layout.js";
const base=[0,0,1,0,0,1,1,1];
const uv={ count:4, array:[...base],setXY(i,u,v){this.array[i*2]=u;this.array[i*2+1]=v;} };
const positions=[0,0,0,1,0,0];
const geometry={attributes:{uv,position:{array:positions}}};
const originalUV={getX:i=>base[i*2],getY:i=>base[i*2+1]};
applyVideoPageUVs(geometry,originalUV);
assert.deepEqual(uv.array,base,"both pages retain complete independent UVs");
assert.deepEqual(positions,[0,0,0,1,0,0],"original page positions stay untouched");
for(const [width,height] of [[1920,1080],[1024,1368],[1080,1920]]){
 const frame=fitPageFrame(width,height,768,1026);
 assert.ok(Math.abs(frame.width/frame.height-width/height)<1e-10,"landscape and portrait sources retain their full aspect ratio");
 assert.ok(frame.x>=768*.04 && frame.x+frame.width<=768*.92+1e-8,"video stays outside the spine gutter");
 assert.ok(frame.y>=0 && frame.y+frame.height<=1026,"the complete video stays on the page");
}
console.log("PASS: independent full-page UVs, original positions, complete landscape/portrait footage and spine gutter.");
