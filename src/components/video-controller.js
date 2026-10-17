export const HOSTED_VIDEO_URL = "https://media.w-i-z-z-lab-studios.com/space-junkz/background_video2.mp4";
export const TEST_VIDEO_FALLBACK = "/test-media/background.mp4";

export function getPlaybackSources({ url, fallback }) {
  return fallback?.startsWith("/") ? { url: fallback, fallback: url } : { url, fallback };
}

// One current stream plus one prepared stream; frozen canvas frames survive decoder release.
export function createVideoController(video, texture, onStatus, onReady, sources = {}, { startPaused = false } = {}) {
  let active = false, visible = true, preload = false, paused = startPaused, disposed = false;
  let attached = false, routeIndex = 0, failed = false, timer = null, attempt = 0;
  let retryTimer = null, retryCount = 0, hasFrame = false, preparing = false, resumeAt = 0;
  const routes = [...new Set([sources.url, sources.fallback].filter(Boolean))];
  const wantsPlayback = () => active && visible && !paused && !disposed;
  const canPlay = () => visible && !disposed && !failed && (wantsPlayback() || preparing);
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const clearRetry = () => { if (retryTimer !== null) clearTimeout(retryTimer); retryTimer = null; };
  const status = value => { if (!disposed) onStatus(value); };

  function markReady() {
    if (video.readyState < 2) return false;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    hasFrame = true;
    onReady(true);
    return true;
  }
  function release() {
    clearTimer(); clearRetry();
    preparing = false;
    if (!attached) return;
    resumeAt = Number.isFinite(video.currentTime) ? video.currentTime : resumeAt;
    attached = false;
    failed = false;
    attempt += 1;
    video.pause();
    video.removeAttribute("src");
    video.load();
    // Do not clear onReady: the canvas keeps this page's last real video frame.
  }
  function scheduleRetry() {
    if ((!wantsPlayback() && !preload) || !visible || retryTimer !== null || retryCount >= 2 || !routes.length) return;
    retryCount += 1;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (visible && (wantsPlayback() || preload)) load(0);
    }, retryCount * 2000);
  }
  function fail() {
    clearTimer();
    failed = true; preparing = false;
    video.pause(); status("error"); scheduleRetry();
  }
  function nextRoute() {
    if (disposed || !attached || failed) return;
    if (routeIndex + 1 < routes.length) load(routeIndex + 1);
    else fail();
  }
  function completePreparation() {
    if (!preparing || !markReady()) return;
    preparing = false;
    video.pause();
    clearTimer();
    status("ready");
  }
  function play() {
    if (!canPlay()) return;
    const currentAttempt = attempt;
    video.play().then(() => {
      if (disposed || currentAttempt !== attempt || !canPlay()) return;
      if (preparing) completePreparation();
      else if (video.readyState >= 2) { clearTimer(); markReady(); status("playing"); }
    }).catch(error => {
      if (disposed || currentAttempt !== attempt || !canPlay() || error.name === "AbortError") return;
      clearTimer();
      preparing = false;
      status(active ? "paused" : "ready");
    });
  }
  function load(index = 0) {
    clearTimer(); clearRetry();
    if (!routes.length) { failed = true; status("error"); return; }
    routeIndex = index; attached = true; failed = false; attempt += 1;
    preparing = !active && preload && !hasFrame;
    if (!hasFrame) onReady(false);
    status("loading");
    video.src = routes[routeIndex];
    video.load();
    const currentAttempt = attempt;
    timer = setTimeout(() => {
      timer = null;
      if (!disposed && currentAttempt === attempt) nextRoute();
    }, 20000);
    play();
  }
  const onMetadata = () => {
    if (!attached) return;
    texture.repeat.set(1, 1); texture.offset.set(0, 0);
    if (resumeAt > 0 && Number.isFinite(video.duration)) {
      try { video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.05)); } catch {}
    }
  };
  const onData = () => {
    if (disposed || !attached || failed || video.readyState < 2) return;
    clearTimer();
    if (preparing) { completePreparation(); return; }
    markReady();
    if (wantsPlayback()) play();
    else status(active ? "paused" : "ready");
  };
  const onPlaying = () => {
    if (!canPlay()) { video.pause(); return; }
    if (preparing) { completePreparation(); return; }
    clearTimer(); clearRetry();
    if (video.readyState >= 2) markReady();
    status("playing");
  };
  const onPause = () => {
    if (!canPlay()) clearTimer();
    if (!disposed && attached && !failed && !preparing) status(active ? "paused" : "ready");
  };
  const onWaiting = () => {
    if (!canPlay()) return;
    status("loading");
    if (timer === null) {
      const currentAttempt = attempt;
      timer = setTimeout(() => {
        timer = null;
        if (!disposed && currentAttempt === attempt && canPlay()) nextRoute();
      }, 15000);
    }
  };
  const listeners = {
    loadedmetadata: onMetadata, loadeddata: onData, canplay: onData, seeked: onData,
    error: nextRoute, playing: onPlaying, pause: onPause, waiting: onWaiting, stalled: onWaiting,
  };
  for (const [event, callback] of Object.entries(listeners)) video.addEventListener(event, callback);

  return {
    update(next) {
      if (disposed) return;
      const wasActive = active, wasVisible = visible;
      if ("active" in next) active = next.active;
      if ("visible" in next) visible = next.visible;
      if ("preload" in next) preload = next.preload;
      if (!visible || (!active && !preload)) { release(); return; }
      if (!attached || (failed && (!wasActive || !wasVisible))) {
        retryCount = 0; load(0); return;
      }
      if (failed) { scheduleRetry(); return; }
      if (active) {
        preparing = false;
        if (paused) video.pause();
        else play();
      } else if (!hasFrame) { preparing = true; play(); }
      else { preparing = false; video.pause(); status("ready"); }
    },
    toggle() {
      if (disposed) return;
      paused = !video.paused;
      if (paused) { preparing = false; clearTimer(); clearRetry(); video.pause(); }
      else if (!attached || failed) { retryCount = 0; load(0); }
      else play();
    },
    retry() {
      if (disposed) return;
      paused = false; retryCount = 0; load(0);
    },
    dispose() {
      if (disposed) return;
      release();
      disposed = true;
      for (const [event, callback] of Object.entries(listeners)) video.removeEventListener(event, callback);
      video.remove();
      texture.dispose();
    },
  };
}
