import { useEffect, useRef, useState } from "react";

const entryKey = "book-space-entered";
const browserUrl = "https://book-space-gold.vercel.app/";
const ua = navigator.userAgent || "";
const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Line\/|Twitter|TikTok/i.test(ua);
const android = /Android/i.test(ua);
const chromeIntent = "intent://book-space-gold.vercel.app/#Intent;scheme=https;package=com.android.chrome;end";
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
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let entered = false;
    try { entered = sessionStorage.getItem(entryKey) === "yes"; } catch {}
    if (!entered && !isFullscreen() && (canFullscreen() || inAppBrowser)) dialog.current?.showModal();
    return () => { if (dialog.current?.open) dialog.current.close(); };
  }, []);
  const dismiss = () => {
    try { sessionStorage.setItem(entryKey, "yes"); } catch {}
    dialog.current?.close();
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(browserUrl);
      setNotice("Link copied. Open Chrome or Safari and paste it into the address bar.");
    } catch {
      setNotice("Copy this address into Chrome or Safari: " + browserUrl);
    }
  };
  const tryFullscreen = async () => {
    const success = await enterFullscreen();
    if (success) dismiss();
    else setNotice("This browser blocks fullscreen. Open Book Space in Chrome or Safari instead.");
  };
  return (
    <dialog ref={dialog} className="fullscreen-entry pointer-events-auto" aria-labelledby="book-entry-title"
      onCancel={event => { event.preventDefault(); dismiss(); }}>
      <span className="book-entry-brand">WIZZ LAB STUDIOS</span>
      <h1 id="book-entry-title">Enter the book.</h1>
      <p>{inAppBrowser ? "Facebook's built-in browser may block fullscreen. For the best experience, open the book in your normal browser." : "Explore the showroom in fullscreen."}</p>
      {inAppBrowser && android && <a className="book-entry-browser" href={chromeIntent}>Open in Chrome ↗</a>}
      {inAppBrowser && !android && <p className="book-entry-help">Use the browser menu (⋯) and choose “Open in browser”, or copy the link below.</p>}
      {inAppBrowser && <button type="button" className="book-entry-copy" onClick={copyLink}>Copy link for browser</button>}
      {canFullscreen() && <button type="button" autoFocus={!inAppBrowser} onClick={tryFullscreen}>Enter fullscreen ↗</button>}
      {notice && <p className="book-entry-notice" role="status">{notice}</p>}
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
