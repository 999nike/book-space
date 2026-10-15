import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { fitPageFrame } from "./video-layout";

export function createPageVideoTexture(video, { fit = "contain", cropTop = 0, cropBottom = 0 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1026;
  const ctx = canvas.getContext("2d", { alpha: false });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  let disposed = false, frameHandle = null, lastTime = -1;
  let lastUploadedTime = -Infinity;
  const MIN_FRAME_INTERVAL = 1 / 30;
  const draw = () => {
    if (disposed || !ctx || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
    const sourceY = video.videoHeight * Math.min(0.25, Math.max(0, cropTop));
    const sourceHeight = video.videoHeight * (1 - Math.min(0.25, Math.max(0, cropBottom))) - sourceY;
    const frame = fitPageFrame(video.videoWidth, sourceHeight, canvas.width, canvas.height, "left", fit);
    ctx.fillStyle = "#090b18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, sourceY, video.videoWidth, sourceHeight, frame.x, frame.y, frame.width, frame.height);
    texture.needsUpdate = true;
    lastTime = video.currentTime;
  };
  const useVideoFrames = typeof video.requestVideoFrameCallback === "function";
  const cancelTick = () => {
    if (frameHandle === null) return;
    if (useVideoFrames) video.cancelVideoFrameCallback(frameHandle);
    else cancelAnimationFrame(frameHandle);
    frameHandle = null;
  };
  const scheduleTick = () => {
    if (disposed || video.paused || frameHandle !== null) return;
    frameHandle = useVideoFrames ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
  };
  const tick = (_now, metadata) => {
    frameHandle = null;
    if (disposed || video.paused) return;
    const mediaTime = metadata?.mediaTime ?? video.currentTime;
    if (video.readyState >= 2 && mediaTime !== lastTime &&
        (mediaTime < lastUploadedTime || mediaTime - lastUploadedTime >= MIN_FRAME_INTERVAL - 0.002)) {
      draw();
      lastUploadedTime = mediaTime;
    }
    scheduleTick();
  };
  const onPlay = () => scheduleTick();
  const onPause = () => cancelTick();
  video.addEventListener("loadeddata", draw);
  video.addEventListener("seeked", draw);
  video.addEventListener("playing", onPlay);
  video.addEventListener("pause", onPause);
  scheduleTick();
  return {
    texture,
    dispose() {
      disposed = true;
      video.removeEventListener("loadeddata", draw);
      video.removeEventListener("seeked", draw);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      cancelTick();
      // The video controller owns the texture and disposes it with the video.
    },
  };
}
