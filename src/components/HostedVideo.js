import { useEffect, useState } from "react";
import { atom, useSetAtom } from "jotai";
import { createPageVideoTexture } from "./PageVideoTexture";
import { createVideoController, getPlaybackSources } from "./video-controller";
import { STAR_VIDEO } from "./page-content";

export const videoStatusAtom = atom("idle");
export const videoControllerAtom = atom(null);
export const playingClipAtom = atom(null);

export function useHostedVideoTexture(active, clip = STAR_VIDEO) {
  const [readyTexture, setReadyTexture] = useState(null);
  const [position, setPosition] = useState({ id: null, index: 0 });
  const clipIndex = position.id === clip.id ? position.index : 0;
  const currentClip = clip.clips?.[clipIndex] || clip;
  const clipCount = clip.clips?.length || 1;
  const { url, fallback, backup } = currentClip;
  const [controller, setController] = useState(null);
  const setStatus = useSetAtom(videoStatusAtom);
  const setSharedController = useSetAtom(videoControllerAtom);
  const setPlayingClip = useSetAtom(playingClipAtom);

  useEffect(() => {
    setReadyTexture(null);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = clipCount === 1;
    video.playsInline = true;
    video.preload = "metadata";
    video.hidden = true;
    video.setAttribute("aria-hidden", "true");
    const onEnded = () => {
      if (clipCount > 1) setPosition({ id: clip.id, index: (clipIndex + 1) % clipCount });
    };
    video.addEventListener("ended", onEnded);
    document.body.appendChild(video);
    const pageVideo = createPageVideoTexture(video);
    const map = pageVideo.texture;
    const player = createVideoController(video, map, setStatus, (ready) => setReadyTexture(ready ? { url, map } : null), getPlaybackSources({ url, fallback, backup }));
    setPlayingClip({ spreadId: clip.id, url, label: currentClip.label });
    setController(player);
    setSharedController(player);
    return () => {
      video.removeEventListener("ended", onEnded);
      setSharedController(null);
      setPlayingClip(null);
      pageVideo.dispose();
      player.dispose();
    };
  }, [setSharedController, setStatus, setPlayingClip, clip.id, clipIndex, clipCount, currentClip.label, url, fallback, backup]);

  useEffect(() => {
    if (!controller) return;
    const sync = () => controller.update({ active, visible: !document.hidden });
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [controller, active]);

  return readyTexture?.url === url ? readyTexture.map : null;
}
