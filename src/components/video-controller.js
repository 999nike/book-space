import { getVideoCrop, SPREAD_ASPECT } from "./video-layout.js";

export const HOSTED_VIDEO_URL = "https://media.w-i-z-z-lab-studios.com/space-junkz/background_video2.mp4";
export const TEST_VIDEO_FALLBACK = "/test-media/background.mp4";

// Owns only the video element. The book's geometry, materials and animation stay upstream.
export function createVideoController(video, texture, onStatus, onReady, sources = { url: HOSTED_VIDEO_URL, fallback: TEST_VIDEO_FALLBACK }) {
  let active = false, visible = true, paused = false, disposed = false;
  let targetAspect = SPREAD_ASPECT;
  let attached = false, routeIndex = 0, failed = false, timer = null, attempt = 0;
  const routes = [sources.url, sources.fallback, sources.backup].filter(Boolean);
  const playingStatus = () => sources.backup && routeIndex === routes.length - 1 ? "placeholder" : "playing";
  const canPlay = () => active && visible && !paused && !disposed && !failed;
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const status = (value) => { if (!disposed) onStatus(value); };

  function play() {
    if (!canPlay()) return;
    const currentAttempt = attempt;
    video.play().then(() => {
      if (!disposed && currentAttempt === attempt && canPlay()) status(playingStatus());
    }).catch((error) => {
      if (!disposed && currentAttempt === attempt && canPlay() && error.name !== "AbortError") status("paused");
    });
  }
  function load(index = 0) {
    clearTimer();
    routeIndex = index;
    attached = true;
    failed = false;
    attempt += 1;
    onReady(false);
    status("loading");
    video.src = routes[routeIndex];
    video.load();
    timer = setTimeout(() => {
      if (disposed || video.readyState >= 2) return;
      if (routeIndex + 1 < routes.length) load(routeIndex + 1);
      else { failed = true; video.pause(); status("error"); }
    }, routeIndex === 0 ? 10000 : 20000);
    play();
  }
  const onMetadata = () => {
    const crop = getVideoCrop(video.videoWidth, video.videoHeight, targetAspect);
    texture.repeat.set(crop.repeatX, crop.repeatY);
    texture.offset.set(crop.offsetX, crop.offsetY);
  };
  const onData = () => {
    clearTimer();
    onMetadata();
    onReady(true);
    if (canPlay()) play();
    else status("paused");
  };
  const onError = () => {
    if (disposed) return;
    if (routeIndex + 1 < routes.length) load(routeIndex + 1);
    else { clearTimer(); failed = true; onReady(false); status("error"); }
  };
  const onPlaying = () => { if (canPlay()) status(playingStatus()); };
  const onPause = () => { if (!disposed && !failed) status("paused"); };
  const onWaiting = () => { if (canPlay()) status("loading"); };
  const listeners = {
    loadedmetadata: onMetadata, loadeddata: onData, error: onError,
    playing: onPlaying, pause: onPause, waiting: onWaiting,
  };
  for (const [event, callback] of Object.entries(listeners)) video.addEventListener(event, callback);

  return {
    update(next) {
      if (disposed) return;
      if ("aspect" in next && next.aspect > 0) { targetAspect = next.aspect; onMetadata(); }
      if ("active" in next) active = next.active;
      if ("visible" in next) visible = next.visible;
      if (!active || !visible || paused) video.pause();
      else if (!attached) load(0);
      else play();
    },
    toggle() {
      if (disposed) return;
      paused = !video.paused;
      if (paused) video.pause();
      else { if (!attached) load(0); else play(); }
    },
    retry() {
      if (disposed) return;
      paused = false;
      load(0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      attempt += 1;
      clearTimer();
      for (const [event, callback] of Object.entries(listeners)) video.removeEventListener(event, callback);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      texture.dispose();
    },
  };
}
