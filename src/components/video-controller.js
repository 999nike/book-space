export const HOSTED_VIDEO_URL = "https://media.w-i-z-z-lab-studios.com/space-junkz/background_video2.mp4";
export const TEST_VIDEO_FALLBACK = "/test-media/background.mp4";

// Both routes refer to the same clip. Unrelated background videos are never a backup.
export function getPlaybackSources({ url, fallback }) {
  return fallback?.startsWith("/")
    ? { url: fallback, fallback: url }
    : { url, fallback };
}

// A controller only loads its explicitly supplied clip, including during recovery.
export function createVideoController(video, texture, onStatus, onReady, sources = {}, { startPaused = false } = {}) {
  let active = false, visible = true, preload = false, paused = startPaused, disposed = false;
  let attached = false, routeIndex = 0, failed = false, timer = null, attempt = 0;
  let retryTimer = null, retryCount = 0, hasFrame = false;
  const routes = [...new Set([sources.url, sources.fallback].filter(Boolean))];
  const wantsPlayback = () => active && visible && !paused && !disposed;
  const canPlay = () => wantsPlayback() && !failed;
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const clearRetry = () => { if (retryTimer !== null) clearTimeout(retryTimer); retryTimer = null; };
  const status = value => { if (!disposed) onStatus(value); };

  function markReady() {
    if (video.readyState < 2) return;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    hasFrame = true;
    onReady(true);
  }
  function scheduleRetry() {
    if (!wantsPlayback() || retryTimer !== null || retryCount >= 2 || !routes.length) return;
    retryCount += 1;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (wantsPlayback()) load(0);
    }, retryCount * 2000);
  }
  function fail() {
    clearTimer();
    failed = true;
    video.pause();
    status("error");
    // Keep a decoded project frame visible while retrying a temporary failure.
    scheduleRetry();
  }
  function nextRoute() {
    if (disposed || failed) return;
    if (routeIndex + 1 < routes.length) load(routeIndex + 1);
    else fail();
  }
  function play() {
    if (!canPlay()) return;
    const currentAttempt = attempt;
    video.play().then(() => {
      if (!disposed && currentAttempt === attempt && canPlay()) {
        if (video.readyState >= 2) { clearTimer(); markReady(); status("playing"); }
      }
    }).catch(error => {
      if (!disposed && currentAttempt === attempt && canPlay() && error.name !== "AbortError") {
        clearTimer();
        status("paused");
      }
    });
  }
  function load(index = 0) {
    clearTimer();
    clearRetry();
    if (!routes.length) { failed = true; status("error"); return; }
    routeIndex = index;
    attached = true;
    failed = false;
    attempt += 1;
    if (!hasFrame) onReady(false);
    status("loading");
    video.src = routes[routeIndex];
    video.load();
    const currentAttempt = attempt;
    timer = setTimeout(() => {
      timer = null;
      if (!disposed && currentAttempt === attempt) nextRoute();
    }, routeIndex === 0 ? 10000 : 20000);
    play();
  }
  const onData = () => {
    if (disposed || failed || video.readyState < 2) return;
    clearTimer();
    markReady();
    if (canPlay()) play();
    else status("paused");
  };
  const onPlaying = () => {
    if (!canPlay()) { video.pause(); return; }
    clearTimer();
    clearRetry();
    if (video.readyState >= 2) markReady();
    status("playing");
  };
  const onPause = () => {
    if (!wantsPlayback()) clearTimer();
    if (!disposed && !failed) status("paused");
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
    loadedmetadata: () => { texture.repeat.set(1, 1); texture.offset.set(0, 0); },
    loadeddata: onData, canplay: onData, error: nextRoute,
    playing: onPlaying, pause: onPause, waiting: onWaiting, stalled: onWaiting,
  };
  for (const [event, callback] of Object.entries(listeners)) video.addEventListener(event, callback);

  return {
    update(next) {
      if (disposed) return;
      const wasActive = active, wasVisible = visible;
      if ("active" in next) active = next.active;
      if ("visible" in next) visible = next.visible;
      if ("preload" in next) preload = next.preload;
      if (!wantsPlayback()) {
        clearRetry();
        video.pause();
        if (!attached && visible && preload) load(0);
      } else if (!attached || (failed && (!wasActive || !wasVisible))) {
        retryCount = 0;
        load(0);
      } else if (failed) scheduleRetry();
      else play();
    },
    toggle() {
      if (disposed) return;
      paused = !video.paused;
      if (paused) { clearTimer(); clearRetry(); video.pause(); }
      else if (!attached || failed) { retryCount = 0; load(0); }
      else play();
    },
    retry() {
      if (disposed) return;
      paused = false;
      retryCount = 0;
      load(0);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      attempt += 1;
      clearTimer();
      clearRetry();
      for (const [event, callback] of Object.entries(listeners)) video.removeEventListener(event, callback);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      texture.dispose();
    },
  };
}
