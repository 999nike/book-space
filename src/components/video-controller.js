export const HOSTED_VIDEO_URL = "https://media.w-i-z-z-lab-studios.com/space-junkz/background_video2.mp4";
export const TEST_VIDEO_FALLBACK = "/test-media/background.mp4";

// Owns only the video element. The book's geometry, materials and animation stay upstream.
export function createVideoController(video, texture, onStatus, onReady) {
  let active = false, visible = true, paused = false, disposed = false;
  let attached = false, fallback = false, failed = false, timer = null, attempt = 0;
  const canPlay = () => active && visible && !paused && !disposed && !failed;
  const clearTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const status = (value) => { if (!disposed) onStatus(value); };

  function play() {
    if (!canPlay()) return;
    const currentAttempt = attempt;
    video.play().then(() => {
      if (!disposed && currentAttempt === attempt && canPlay()) status("playing");
    }).catch((error) => {
      if (!disposed && currentAttempt === attempt && canPlay() && error.name !== "AbortError") status("paused");
    });
  }
  function load(useFallback) {
    clearTimer();
    fallback = useFallback;
    attached = true;
    failed = false;
    attempt += 1;
    onReady(false);
    status("loading");
    video.src = fallback ? TEST_VIDEO_FALLBACK : HOSTED_VIDEO_URL;
    video.load();
    timer = setTimeout(() => {
      if (disposed || video.readyState >= 2) return;
      if (!fallback) load(true);
      else { failed = true; video.pause(); status("error"); }
    }, fallback ? 20000 : 10000);
    play();
  }
  const onMetadata = () => {
    // Center-crop this landscape background onto the original portrait page.
    const pageAspect = 1.28 / 1.71;
    const videoAspect = video.videoWidth / video.videoHeight;
    texture.repeat.set(1, 1);
    texture.offset.set(0, 0);
    if (videoAspect > pageAspect) {
      texture.repeat.x = pageAspect / videoAspect;
      texture.offset.x = (1 - texture.repeat.x) / 2;
    } else if (videoAspect > 0) {
      texture.repeat.y = videoAspect / pageAspect;
      texture.offset.y = (1 - texture.repeat.y) / 2;
    }
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
    if (!fallback) load(true);
    else { clearTimer(); failed = true; onReady(false); status("error"); }
  };
  const onPlaying = () => { if (canPlay()) status("playing"); };
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
      if ("active" in next) active = next.active;
      if ("visible" in next) visible = next.visible;
      if (!active || !visible || paused) video.pause();
      else if (!attached) load(false);
      else play();
    },
    toggle() {
      if (disposed) return;
      paused = !video.paused;
      if (paused) video.pause();
      else { if (!attached) load(false); else play(); }
    },
    retry() {
      if (disposed) return;
      paused = false;
      load(false);
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
