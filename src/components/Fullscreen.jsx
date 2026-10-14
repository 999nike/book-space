import { useEffect, useRef, useState } from "react";

const entryKey = "book-space-entered";
const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
const canFullscreen = () => Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen) && document.fullscreenEnabled !== false;

async function enterFullscreen() {
  try {
    if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
    else return false;
    return true;
  } catch {
    return false;
  }
}

export function FullscreenEntry() {
  const dialog = useRef(null);
  useEffect(() => {
    let entered = false;
    try { entered = sessionStorage.getItem(entryKey) === "yes"; } catch {}
    if (!entered && !isFullscreen() && canFullscreen()) dialog.current?.showModal();
    return () => { if (dialog.current?.open) dialog.current.close(); };
  }, []);
  const dismiss = () => {
    try { sessionStorage.setItem(entryKey, "yes"); } catch {}
    dialog.current?.close();
  };
  return (
    <dialog ref={dialog} className="fullscreen-entry pointer-events-auto" aria-labelledby="book-entry-title"
      onCancel={event => { event.preventDefault(); dismiss(); }}>
      <span className="book-entry-brand">WIZZ LAB STUDIOS</span>
      <h1 id="book-entry-title">Enter the book.</h1>
      <p>Explore the showroom in fullscreen.</p>
      <button type="button" autoFocus onClick={async () => { await enterFullscreen(); dismiss(); }}>Enter fullscreen ↗</button>
      <button type="button" className="book-entry-window" onClick={dismiss}>Continue in window</button>
    </dialog>
  );
}

export function FullscreenToggle() {
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);
  if (!canFullscreen()) return null;
  return <button type="button" onClick={async () => {
    if (!isFullscreen()) await enterFullscreen();
    else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      } catch {}
    }
  }}>{fullscreen ? "Exit fullscreen" : "Fullscreen ↗"}</button>;
}
