import { useEffect } from "react";
import { FullscreenEntry, FullscreenToggle } from "./Fullscreen";
import { atom, useAtom, useAtomValue } from "jotai";
import { playingClipAtom, videoControllerAtom, videoStatusAtom } from "./HostedVideo";

import { BOOK_SHEETS, getSpreadProject, getSpreadVideo, isBookOpen, projects, getPageTextures, isStarSpread } from "./page-content";

export const pageAtom = atom(0);
export const playbackPageAtom = atom(0);
export const pages = Array.from({ length: BOOK_SHEETS }, (_, number) => getPageTextures(number, BOOK_SHEETS));

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const playbackPage = useAtomValue(playbackPageAtom);
  const status = useAtomValue(videoStatusAtom);
  const clip = getSpreadVideo(page);
  const project = getSpreadProject(page);
  const controller = useAtomValue(videoControllerAtom);
  const playingClip = useAtomValue(playingClipAtom);
  const currentClip = clip && playingClip?.spreadId === clip.id ? playingClip : clip;

  useEffect(() => {
    if (page === 0) return;
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play().catch(() => {});
    return () => audio.pause();
  }, [page]);

  useEffect(() => {
    const onKey = (event) => {
      if (document.querySelector("dialog[open]")) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); setPage((value) => Math.min(pages.length, value + 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setPage((value) => Math.max(0, value - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPage]);

  return (
    <main className="book-ui pointer-events-none select-none fixed inset-0 z-10 flex justify-end flex-col">
      <FullscreenEntry />
      {isBookOpen(page, pages.length) && !isStarSpread(page) && ["loading", "paused", "error"].includes(status) && (
        <div className="book-video-notice pointer-events-auto" role="status" aria-live="polite">
          <span>{status === "loading" ? `Loading ${project?.title || "video"}…` : status === "error" ? "Video could not load" : "Video paused"}</span>
          {status !== "loading" && <button type="button" onClick={() => status === "error" ? controller?.retry() : controller?.toggle()}>{status === "error" ? "Retry" : "Play video"}</button>}
        </div>
      )}

      <div className="book-toolbar pointer-events-auto" aria-label="Book navigation">
        <details className="book-controls" onKeyDown={event => { if (event.key === "Escape") event.currentTarget.open = false; }}>
          <summary>Controls</summary>
          <div className="book-controls-panel">
            <FullscreenToggle />
            {new URLSearchParams(window.location.search).get("desk") !== "off" && <a className="site-link" href="https://www.cgtrader.com/designers/jaximus" target="_blank" rel="noopener noreferrer">Desk by Jaximus</a>}
            {isBookOpen(page, pages.length) && <span role="status">{status === "loading" ? "Loading video…" : status === "error" ? "Video unavailable" : status === "placeholder" ? "Star preview" : currentClip.label}</span>}
            <button type="button" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>← Previous</button>
            <button type="button" aria-label="Next page" disabled={page === pages.length} onClick={() => setPage(value => Math.min(pages.length, value + 1))}>Next →</button>
            {isBookOpen(page, pages.length) && (
              <>
                <button type="button" disabled={!controller || status === "loading" || status === "error"} onClick={() => controller?.toggle()}>
                  {(status === "playing" || status === "placeholder") ? "Pause" : "Play"}
                </button>
                {(status === "error" || status === "paused" || status === "placeholder") && <button type="button" onClick={() => controller?.retry()}>Retry</button>}
                {project?.href && <a className="site-link" href={project.href} target="_blank" rel="noopener noreferrer">Open website ↗</a>}
              </>
            )}
          </div>
        </details>
        <select className="book-page-select" aria-label="Choose a page" value={page} onChange={event => setPage(Number(event.target.value))}>
          {pages.map((_, index) => <option key={index} value={index}>{index === 0 ? "Cover" : index === pages.length - 1 ? "Index" : "Page " + index}</option>)}
          <option value={pages.length}>Back cover</option>
        </select>
      </div>
      {playbackPage === pages.length - 1 && (
        <aside className="project-index pointer-events-auto" aria-label="Project index">
          <span className="index-label">THE INDEX</span>
          {projects.map((project, index) => (
            <a key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">
              <span>{String(index + 1).padStart(2, "0")} · {project.title}</span><span aria-hidden="true">↗</span>
            </a>
          ))}
        </aside>
      )}

    </main>
  );
};
