import assert from "node:assert/strict";
import { applyVideoPageUVs, getVideoCrop, PAGE_ASPECT, SPREAD_ASPECT } from "./src/components/video-layout.js";

const base = [0,0,1,0,0,1,1,1, 0,0,1,0,0,1,1,1];
const originalUV = { getX: i => base[i*2], getY: i => base[i*2+1] };
const positions = [0,0,0,1,0,0,0,1,0];
const uv = { array: [...base], setXY(i,u,v){this.array[i*2]=u;this.array[i*2+1]=v;} };
const indices = [0,1,2,2,1,3,4,5,6,6,5,7];
const geometry = {
  attributes: { uv, position: {array:positions} },
  index: { getX: i => indices[i] },
  groups: [{materialIndex:4,start:0,count:6},{materialIndex:5,start:6,count:6}],
};
applyVideoPageUVs(geometry, originalUV, {front:"video",back:"video"});
assert.equal(uv.array[0],0.5,"right face starts at the middle of the video");
assert.equal(uv.array[2],1,"right outer edge shows the right of the video");
assert.equal(uv.array[8],0,"left outer edge shows the left of the video");
assert.equal(uv.array[10],0.5,"left face ends at the middle of the video");
assert.equal(uv.array[0],uv.array[10],"both pages meet at one continuous video seam");
assert.deepEqual(positions,[0,0,0,1,0,0,0,1,0],"page positions are untouched");
const once=[...uv.array];
applyVideoPageUVs(geometry, originalUV, {front:"video",back:"video"});
assert.deepEqual(uv.array,once,"indexed triangles and repeated updates never rescale the UVs twice");
applyVideoPageUVs(geometry, originalUV, {front:"cover",back:"video"});
assert.deepEqual(uv.array.slice(0,8),base.slice(0,8),"front cover keeps its full original UVs");
applyVideoPageUVs(geometry, originalUV, {front:"index",back:"cover"});
assert.deepEqual(uv.array,base,"index and back cover keep full original UVs");
applyVideoPageUVs(geometry, originalUV, {front:"video",back:"video"},false);
assert.deepEqual(uv.array,base,"the video next to the final index uses one full page");

const landscape=getVideoCrop(1920,1080);
assert.ok(Math.abs(landscape.repeatX-SPREAD_ASPECT/(1920/1080))<1e-9);
assert.equal(landscape.repeatY,1);
const portrait=getVideoCrop(1024,1368);
assert.equal(portrait.repeatX,1);
assert.ok(Math.abs(portrait.repeatY-0.5)<1e-9,"portrait video crops consistently across the whole spread");
assert.ok(Math.abs(portrait.offsetY-0.25)<1e-9);
const full=getVideoCrop(1024,1368,PAGE_ASPECT);
for(const [key,value] of Object.entries({repeatX:1,repeatY:1,offsetX:0,offsetY:0}))assert.ok(Math.abs(full[key]-value)<1e-9);
console.log("PASS: one continuous video seam, correct left/right halves, no double mapping, unchanged covers/index/positions, aspect-preserving spread crop.");
