import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { fitPageFrame } from "./video-layout";

export function createPageVideoTexture(video, { fit = "contain" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1026;
  const ctx = canvas.getContext("2d", { alpha: false });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  let disposed = false, frameHandle = null, lastTime = -1;
  const draw = () => {
    if (disposed || !ctx || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return;
    const frame = fitPageFrame(video.videoWidth, video.videoHeight, canvas.width, canvas.height, "left", fit);
    ctx.fillStyle = "#090b18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, frame.x, frame.y, frame.width, frame.height);
    texture.needsUpdate = true;
    lastTime = video.currentTime;
  };
  const useVideoFrames = typeof video.requestVideoFrameCallback === "function";
  const tick = () => {
    if (disposed) return;
    if (useVideoFrames || lastTime !== video.currentTime) draw();
    frameHandle = useVideoFrames ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick);
  };
  video.addEventListener("loadeddata", draw);
  video.addEventListener("seeked", draw);
  tick();
  return {
    texture,
    dispose() {
      disposed = true;
      video.removeEventListener("loadeddata", draw);
      video.removeEventListener("seeked", draw);
      if (frameHandle !== null) {
        if (useVideoFrames) video.cancelVideoFrameCallback(frameHandle);
        else cancelAnimationFrame(frameHandle);
      }
      // The video controller owns the texture and disposes it with the video.
    },
  };
}
