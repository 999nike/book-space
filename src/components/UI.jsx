import { useEffect } from "react";
import { atom, useAtom, useAtomValue } from "jotai";
import { videoControllerAtom, videoStatusAtom } from "./HostedVideo";
import { HOSTED_VIDEO_URL } from "./video-controller";

const pictures = [
  "DSC00680",
  "DSC00933",
  "DSC00966",
  "DSC00983",
  "DSC01011",
  "DSC01040",
  "DSC01064",
  "DSC01071",
  "DSC01103",
  "DSC01145",
  "DSC01420",
  "DSC01461",
  "DSC01489",
  "DSC02031",
  "DSC02064",
  "DSC02069",
];

export const pageAtom = atom(0);
export const pages = [
  {
    front: "book-cover",
    back: "video-test-poster",
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "book-back",
});


export const UI = () => {
  const [page, setPage] = useAtom(pageAtom);
  const status = useAtomValue(videoStatusAtom);
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
      {page === 1 && (
        <div className="video-controls pointer-events-auto" aria-label="First page video controls">
          <span role="status">{status === "loading" ? "Loading video…" : status === "error" ? "Video unavailable" : "Background video"}</span>
          <button type="button" disabled={!controller || status === "loading" || status === "error"} onClick={() => controller?.toggle()}>
            {status === "playing" ? "Pause" : "Play"}
          </button>
          {(status === "error" || status === "paused") && <button type="button" onClick={() => controller?.retry()}>Retry</button>}
          <a href={HOSTED_VIDEO_URL} target="_blank" rel="noopener noreferrer">Open clip ↗</a>
        </div>
      )}
      <nav className="w-full overflow-auto pointer-events-auto flex justify-center" aria-label="Book pages">
        <div className="overflow-auto flex items-center gap-4 max-w-full p-10">
          {[...pages].map((_, index) => (
            <button type="button" key={index} aria-current={index === page ? "page" : undefined}
              className={`border-transparent hover:border-white transition-all duration-300 px-4 py-3 rounded-full text-lg uppercase shrink-0 border ${index === page ? "bg-white/90 text-black" : "bg-black/30 text-white"}`}
              onClick={() => setPage(index)}>
              {index === 0 ? "Cover" : `Page ${index}`}
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
