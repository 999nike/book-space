import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getVideoPageState, getSpreadVideo } from "./src/components/page-content.js";
import { createVideoController, getPlaybackSources } from "./src/components/video-controller.js";

const attached = new Set();
class PhoneVideo {
  paused = true; readyState = 0; currentTime = 0; duration = 60; events = new Map(); loads = 0;
  addEventListener(name, callback) { if (!this.events.has(name)) this.events.set(name, new Set()); this.events.get(name).add(callback); }
  removeEventListener(name, callback) { this.events.get(name)?.delete(callback); if (!this.events.get(name)?.size) this.events.delete(name); }
  fire(name) { for (const callback of [...this.events.get(name) || []]) callback(); }
  set src(value) { this.source = value; attached.add(this); }
  get src() { return this.source; }
  play() { this.paused = false; if (this.readyState >= 2) this.fire("playing"); return Promise.resolve(); }
  pause() { if (!this.paused) { this.paused = true; this.fire("pause"); } }
  load() { this.loads++; this.readyState = 0; }
  removeAttribute(name) { if (name === "src") { this.source = undefined; attached.delete(this); } }
  remove() {}
}
const texture = () => ({ repeat: { set() {} }, offset: { set() {} }, dispose() {} });
const entries = Array.from({ length: 7 }, (_, i) => {
  const spread = i + 1, video = new PhoneVideo(), readiness = [];
  return { spread, video, readiness, player: createVideoController(video, texture(), () => {}, value => readiness.push(value), getPlaybackSources(getSpreadVideo(spread))) };
});
function statesFor(entry, requested, playing) {
  const a = getVideoPageState(entry.spread, requested, playing);
  if (entry.spread !== 7) return a;
  const b = getVideoPageState(8, requested, playing);
  return { active: a.active || b.active, preload: a.preload || b.preload };
}
function turn(requested, playing) {
  const states = entries.map(entry => statesFor(entry, requested, playing));
  assert.ok(states.filter(state => state.active || state.preload).length <= 2, "at most current/outgoing plus prepared/incoming");
  // Release nonparticipants before exercising the two-decoder phone budget.
  entries.forEach((entry, i) => { if (!states[i].active && !states[i].preload) entry.player.update({ ...states[i], visible: true }); });
  entries.forEach((entry, i) => { if (states[i].active || states[i].preload) entry.player.update({ ...states[i], visible: true }); });
  assert.ok(attached.size <= 2, "visited pages must not retain hardware decoders");
  entries.forEach((entry, i) => {
    const { active, preload } = states[i];
    if (entry.video.src && entry.video.readyState < 2) {
      entry.video.readyState = 4; entry.video.fire("loadedmetadata"); entry.video.fire("canplay");
    }
    if (active) assert.equal(entry.video.paused, false, "incoming page plays before animation settlement");
    else if (preload) assert.equal(entry.video.paused, true, "next page stops after preparing its first frame");
    else assert.equal(entry.video.src, undefined, "off-page source is detached");
  });
}
turn(0, 0);
assert.equal(entries[0].readiness.at(-1), true, "page one prepared behind closed cover");
let previous = 0;
for (const page of [1, 2, 3, 4, 5, 6, 7, 8, 6, 4, 2, 1]) {
  turn(page, previous);
  const entry = entries[Math.min(page, 7) - 1];
  assert.equal(entry.video.paused, false, "requested page starts even if the settled page is still old");
  turn(page, page);
  previous = page;
}
const visible = entries[0];
visible.video.currentTime = 6.5;
turn(3, 3);
assert.equal(visible.video.src, undefined);
assert.equal(visible.readiness.at(-1), true, "releasing decoder preserves the frozen project frame");
turn(1, 1);
assert.equal(visible.video.currentTime, 6.5, "returning page resumes at its previous position");
for (const entry of entries) entry.player.dispose();
assert.equal(attached.size, 0);

const blocked = new PhoneVideo(), statuses = [];
let allowPlayback = false;
blocked.play = function() {
  if (!allowPlayback) { this.paused = true; return Promise.reject(Object.assign(new Error("gesture required"), { name: "NotAllowedError" })); }
  this.paused = false; return Promise.resolve();
};
const blockedPlayer = createVideoController(blocked, texture(), value => statuses.push(value), () => {}, getPlaybackSources(getSpreadVideo(4)));
blockedPlayer.update({ active: true });
await Promise.resolve(); await Promise.resolve();
assert.equal(statuses.at(-1), "paused", "mobile autoplay rejection is surfaced for a real Play button");
allowPlayback = true;
blockedPlayer.toggle();
assert.equal(blocked.paused, false, "a direct user gesture resumes the current source");
blockedPlayer.dispose();

const originalDocument = globalThis.document;
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() { painted++; } }) }) };
let painted = 0, published = 0;
const source = (await readFile(new URL("./src/components/PageVideoTexture.js", import.meta.url), "utf8"))
  .replace('import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";', 'class CanvasTexture { constructor(canvas) { this.image = canvas; } } const LinearFilter = 1, SRGBColorSpace = 1;')
  .replace('from "./video-layout"', 'from ' + JSON.stringify(new URL("./src/components/video-layout.js", import.meta.url).href));
const { createPageVideoTexture } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const firstFrame = new PhoneVideo();
firstFrame.videoWidth = 1080; firstFrame.videoHeight = 2340;
const page = createPageVideoTexture(firstFrame, { onReady() { assert.ok(painted > 0, "publish texture only after drawing a real frame"); published++; } });
assert.equal(published, 0);
firstFrame.readyState = 2;
firstFrame.fire("canplay");
assert.equal(published, 1, "canplay-only mobile path paints without needing loadeddata");
firstFrame.fire("canplay");
assert.equal(published, 1, "first-frame publication happens once");
page.dispose();
assert.equal(firstFrame.events.size, 0);
globalThis.document = originalDocument;
console.log("PASS: closed-cover warmup, all later pages, rapid jumps, two-decoder limit, outgoing frames, resume, autoplay recovery and canplay-only canvas readiness.");
