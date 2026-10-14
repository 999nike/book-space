import { useEffect, useState } from "react";
import { atom, useSetAtom } from "jotai";
import { SRGBColorSpace, VideoTexture } from "three";
import { createVideoController } from "./video-controller";

export const videoStatusAtom = atom("idle");
export const videoControllerAtom = atom(null);

export function useHostedVideoTexture(active) {
  const [texture, setTexture] = useState(null);
  const [controller, setController] = useState(null);
  const setStatus = useSetAtom(videoStatusAtom);
  const setSharedController = useSetAtom(videoControllerAtom);

  useEffect(() => {
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
    const player = createVideoController(video, map, setStatus, (ready) => setTexture(ready ? map : null));
    setController(player);
    setSharedController(player);
    return () => {
      setSharedController(null);
      player.dispose();
    };
  }, [setSharedController, setStatus]);

  useEffect(() => {
    if (!controller) return;
    const sync = () => controller.update({ active, visible: !document.hidden });
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [controller, active]);

  return texture;
}
