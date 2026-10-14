import { useEffect } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { videoControllerAtom, videoStatusAtom } from "./HostedVideo";

import { BOOK_SHEETS, getSpreadVideo, isBookOpen, projects } from "./page-content";

export const pageAtom = atom(0);
export const pages = Array.from({ length: BOOK_SHEETS }, (_, number) => ({
  front: number === 0 ? "book-cover" : "video-test-poster",
  back: number === BOOK_SHEETS - 1 ? "book-back" : "video-test-poster",
}));

export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const status = useAtomValue(videoStatusAtom);
  const clip = getSpreadVideo(page);
  const controller = useAtomValue(videoControllerAtom);

  useEffect(() => {
    if (page === 0) return;
    const audio = new Audio("/audios/page-flip-01a.mp3");
    audio.play().catch(() => {});
    return () => audio.pause();
  }, [page]);

  useEffect(() => {
    const onKey = (event) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (event.key === "ArrowRight") { event.preventDefault(); setPage((value) => Math.min(pages.length, value + 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setPage((value) => Math.max(0, value - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPage]);

  return (
    <main className="book-ui pointer-events-none select-none fixed inset-0 z-10 flex justify-end flex-col">
      {isBookOpen(page, pages.length) && (
        <div className="video-controls pointer-events-auto" aria-label="Book video controls">
          <span role="status">{status === "loading" ? "Loading video…" : status === "error" ? "Video unavailable" : status === "placeholder" ? "Star preview" : clip.label}</span>
          <button type="button" disabled={!controller || status === "loading" || status === "error"} onClick={() => controller?.toggle()}>
            {(status === "playing" || status === "placeholder") ? "Pause" : "Play"}
          </button>
          {(status === "error" || status === "paused" || status === "placeholder") && <button type="button" onClick={() => controller?.retry()}>Retry</button>}
          <a href={clip.url} target="_blank" rel="noopener noreferrer">Open clip ↗</a>
        </div>
      )}
      {page === pages.length - 1 && (
        <aside className="project-index pointer-events-auto" aria-label="Project index">
          <span className="index-label">THE INDEX</span>
          {projects.map((project, index) => (
            <a key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">
              <span>{String(index + 1).padStart(2, "0")} · {project.title}</span><span aria-hidden="true">↗</span>
            </a>
          ))}
        </aside>
      )}
      <nav className="w-full overflow-auto pointer-events-auto flex justify-center" aria-label="Book pages">
        <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
          {[...pages].map((_, index) => (
            <button type="button" key={index} aria-current={index === page ? "page" : undefined}
              className={`border-transparent hover:border-white transition-all duration-300 px-4 py-3 rounded-full text-lg uppercase shrink-0 border ${index === page ? "bg-white/90 text-black" : "bg-black/30 text-white"}`}
              onClick={() => setPage(index)}>
              {index === 0 ? "Cover" : index === pages.length - 1 ? "Index" : `Page ${index}`}
            </button>
          ))}
          <button type="button" aria-current={page === pages.length ? "page" : undefined}
            className={`border-transparent hover:border-white transition-all duration-300 px-4 py-3 rounded-full text-lg uppercase shrink-0 border ${page === pages.length ? "bg-white/90 text-black" : "bg-black/30 text-white"}`}
            onClick={() => setPage(pages.length)}>Back Cover</button>
        </div>
      </nav>
    </main>
  );
};
