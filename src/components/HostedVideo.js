import { useEffect, useRef, useState } from "react";
import { atom, useSetAtom } from "jotai";
import { createPageVideoTexture } from "./PageVideoTexture";
import { createVideoController, getPlaybackSources } from "./video-controller";
import { STAR_VIDEO } from "./page-content";

export const videoStatusAtom = atom("idle");
export const videoControllerAtom = atom(null);
export const playingClipAtom = atom(null);

export function useHostedVideoTexture(active, clip = STAR_VIDEO, preload = false) {
  const [readyTexture, setReadyTexture] = useState(null);
  const [position, setPosition] = useState({ id: null, index: 0 });
  const activeRef = useRef(active);
  const lastStatus = useRef("idle");
  activeRef.current = active;
  const clipIndex = position.id === clip.id ? position.index : 0;
  const currentClip = clip.clips?.[clipIndex] || clip;
  const clipCount = clip.clips?.length || 1;
  const { url, fallback, backup, fit = "contain", cropBottom = 0 } = currentClip;
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
    video.preload = "auto";
    video.hidden = true;
    video.setAttribute("aria-hidden", "true");
    const onEnded = () => {
      if (activeRef.current && clipCount > 1) setPosition({ id: clip.id, index: (clipIndex + 1) % clipCount });
    };
    video.addEventListener("ended", onEnded);
    document.body.appendChild(video);
    const pageVideo = createPageVideoTexture(video, { fit, cropBottom });
    const map = pageVideo.texture;
    const publishStatus = value => {
      lastStatus.current = value;
      if (activeRef.current) setStatus(value);
    };
    const player = createVideoController(video, map, publishStatus, ready => setReadyTexture(ready ? { url, map } : null), getPlaybackSources({ url, fallback, backup }));
    setController(player);
    return () => {
      video.removeEventListener("ended", onEnded);
      setSharedController(value => value === player ? null : value);
      setPlayingClip(value => value?.controller === player ? null : value);
      pageVideo.dispose();
      player.dispose();
    };
  }, [setSharedController, setPlayingClip, setStatus, clip.id, clipIndex, clipCount, url, fallback, backup, fit, cropBottom]);

  useEffect(() => {
    if (!controller) return;
    const sync = () => controller.update({ active, preload, visible: !document.hidden });
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [controller, active, preload]);

  useEffect(() => {
    if (!active || !controller) return;
    setSharedController(controller);
    setPlayingClip({ controller, spreadId: clip.id, url, label: currentClip.label });
    setStatus(lastStatus.current);
    return () => {
      setSharedController(value => value === controller ? null : value);
      setPlayingClip(value => value?.controller === controller ? null : value);
    };
  }, [active, controller, clip.id, url, currentClip.label, setSharedController, setPlayingClip, setStatus]);

  return readyTexture?.url === url ? readyTexture.map : null;
}
