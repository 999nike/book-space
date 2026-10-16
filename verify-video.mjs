import assert from "node:assert/strict";
import { createVideoController, getPlaybackSources, HOSTED_VIDEO_URL, TEST_VIDEO_FALLBACK } from "./src/components/video-controller.js";
import { BOOK_SHEETS, getPageContent, getPageTextures, getPageTexture, getSpreadVideo, isStarSpread, STAR_VIDEO } from "./src/components/page-content.js";

const neutral = {}, stars = {}, frame = {}, artwork = {}, index = {};
for (let number = 0; number < BOOK_SHEETS; number++) {
  const faces = getPageContent(number, BOOK_SHEETS), textures = getPageTextures(number, BOOK_SHEETS);
  for (const side of ["front", "back"]) {
    const spread = number + (side === "back" ? 1 : 0);
    if (textures[side] === "video-test-poster") {
      assert.equal(faces[side], "stars");
      assert.ok(isStarSpread(spread), "star poster belongs only to an empty spread");
    }
    if (faces[side] !== "stars") assert.notEqual(getPageTexture(faces[side], { picture: neutral, starTexture: stars }), stars);
  }
}
for (const page of [0, BOOK_SHEETS, -1, 99]) {
  assert.equal(isStarSpread(page), false);
  assert.equal(getSpreadVideo(page), null, "covers and unknown pages must not default to stars");
}
for (const page of [7, 8]) assert.equal(getSpreadVideo(page), STAR_VIDEO);
assert.equal(getPageTexture("video", { picture: neutral, starTexture: stars }), neutral);
assert.equal(getPageTexture("video", { picture: neutral, videoTexture: frame, starTexture: stars }), frame);
assert.equal(getPageTexture("preview", { picture: neutral, indexTexture: index, starTexture: stars }), neutral);
assert.equal(getPageTexture("preview", { picture: neutral, previewTexture: artwork, starTexture: stars }), artwork);
assert.equal(getPageTexture("stars", { picture: neutral, starTexture: stars }), stars);
assert.equal(getPageContent(8, 9).front, "index");
assert.deepEqual(getSpreadVideo(1).clips.map(c => c.maxDuration ?? null), [15, 15, 15, null]);

class FakeVideo {
  paused = true; readyState = 0; events = new Map(); history = [];
  addEventListener(name, callback) { this.events.set(name, callback); }
  removeEventListener(name, callback) { if (this.events.get(name) === callback) this.events.delete(name); }
  fire(name) { this.events.get(name)?.(); }
  set src(value) { this.source = value; this.history.push(value); }
  get src() { return this.source; }
  play() { this.paused = false; this.fire("playing"); return Promise.resolve(); }
  pause() { if (!this.paused) { this.paused = true; this.fire("pause"); } }
  load() { this.readyState = 0; }
  removeAttribute(name) { if (name === "src") this.source = undefined; }
  remove() { this.removed = true; }
}
function harness(sources) {
  const video = new FakeVideo(), states = [], ready = [];
  const vector = () => ({ set() {} });
  const texture = { repeat: vector(), offset: vector(), dispose() { this.disposed = true; } };
  const player = createVideoController(video, texture, value => states.push(value), value => ready.push(value), sources);
  return { video, states, ready, texture, player };
}
const originalSetTimeout = globalThis.setTimeout, originalClearTimeout = globalThis.clearTimeout;
const timers = new Map(); let timerId = 0;
globalThis.setTimeout = (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; };
globalThis.clearTimeout = id => timers.delete(id);
const expire = delay => {
  const entry = [...timers].find(([, timer]) => timer.delay === delay);
  assert.ok(entry, "expected timer " + delay);
  timers.delete(entry[0]); entry[1].callback();
};
try {
  const clips = [...getSpreadVideo(1).clips, ...[2, 3, 4, 5, 6].map(getSpreadVideo)];
  for (const clip of clips) {
    const sources = getPlaybackSources({ ...clip, backup: TEST_VIDEO_FALLBACK });
    assert.equal(sources.backup, undefined, "background backup is rejected");
    const { video, player, states, texture } = harness(sources);
    assert.equal(video.src, undefined, "inactive clips do not load");
    player.update({ active: true });
    assert.equal(video.src, clip.fallback);
    video.fire("error");
    assert.equal(video.src, clip.url, "fallback still loads the same project");
    video.fire("error");
    assert.equal(states.at(-1), "error");
    expire(2000);
    assert.equal(video.src, clip.fallback, "temporary failure retries the project");
    video.fire("error"); video.fire("error");
    expire(4000);
    video.fire("error"); video.fire("error");
    assert.equal(timers.size, 0, "retries are bounded");
    assert.ok(video.history.every(url => url === clip.url || url === clip.fallback));
    assert.ok(!video.history.includes(HOSTED_VIDEO_URL) && !video.history.includes(TEST_VIDEO_FALLBACK));
    player.update({ active: false }); player.update({ active: true });
    assert.equal(video.src, clip.fallback, "returning to a failed page retries it");
    player.dispose();
    assert.equal(video.events.size, 0);
    assert.equal(texture.disposed, true);
    assert.equal(timers.size, 0);
  }
  const { video, player, ready } = harness(getPlaybackSources(getSpreadVideo(3)));
  player.update({ active: false, preload: true });
  assert.equal(video.paused, true, "preloading does not start playback");
  video.readyState = 4; video.fire("canplay");
  assert.equal(ready.at(-1), true, "canplay also makes the texture ready");
  player.update({ active: true });
  video.fire("waiting"); expire(15000);
  assert.equal(ready.at(-1), true, "recovery retains the last project frame");
  video.fire("error");
  player.update({ visible: false });
  assert.equal(timers.size, 0, "hidden pages stop pending retries");
  player.update({ visible: true });
  assert.equal(video.src, getSpreadVideo(3).fallback);
  video.readyState = 4; video.fire("loadeddata");
  player.toggle();
  player.update({ visible: false }); player.update({ visible: true });
  assert.equal(video.paused, true, "user pause survives visibility changes");
  player.retry();
  assert.equal(video.src, getSpreadVideo(3).fallback);
  player.dispose();
  assert.equal(timers.size, 0);

  const empty = harness();
  empty.player.update({ active: true });
  assert.equal(empty.video.src, undefined, "no implicit background source");
  assert.equal(empty.states.at(-1), "error");
  empty.player.dispose();
  const background = harness(getPlaybackSources(STAR_VIDEO));
  background.player.update({ active: true });
  assert.equal(background.video.src, TEST_VIDEO_FALLBACK, "explicit empty-page stars still work");
  background.player.dispose();
  assert.equal(timers.size, 0);
  console.log("PASS: all 18 faces isolate stars to empty pages; 9 project clips recover safely through failures, revisits, buffering, visibility, pause and cleanup.");
} finally {
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
}
