import { useEffect, useState } from "react";
import { atom, useSetAtom } from "jotai";
import { SRGBColorSpace, VideoTexture } from "three";
import { createVideoController, getPlaybackSources } from "./video-controller";
import { STAR_VIDEO } from "./page-content";

export const videoStatusAtom = atom("idle");
export const videoControllerAtom = atom(null);

export function useHostedVideoTexture(active, clip = STAR_VIDEO) {
  const [readyTexture, setReadyTexture] = useState(null);
  const { url, fallback, backup } = clip;
  const [controller, setController] = useState(null);
  const setStatus = useSetAtom(videoStatusAtom);
  const setSharedController = useSetAtom(videoControllerAtom);

  useEffect(() => {
    setReadyTexture(null);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.hidden = true;
    video.setAttribute("aria-hidden", "true");
    document.body.appendChild(video);
    const map = new VideoTexture(video);
    map.colorSpace = SRGBColorSpace;
    const player = createVideoController(video, map, setStatus, (ready) => setReadyTexture(ready ? { url, map } : null), getPlaybackSources({ url, fallback, backup }));
    setController(player);
    setSharedController(player);
    return () => {
      setSharedController(null);
      player.dispose();
    };
  }, [setSharedController, setStatus, url, fallback, backup]);

  useEffect(() => {
    if (!controller) return;
    const sync = () => controller.update({ active, visible: !document.hidden });
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [controller, active]);

  return readyTexture?.url === url ? readyTexture.map : null;
}
