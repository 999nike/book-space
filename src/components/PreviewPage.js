import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

export function usePreviewPageTexture(project) {
  const [ready, setReady] = useState(null);
  const { preview, title, href } = project || {};
  useEffect(() => {
    if (!preview) return;
    let cancelled = false, texture = null;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1368;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#090b18";
      ctx.fillRect(0, 0, 1024, 1368);
      const bounds = { x: 80, y: 32, width: 904, height: 1180 };
      const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      ctx.drawImage(image, bounds.x + (bounds.width - width) / 2, bounds.y + (bounds.height - height) / 2, width, height);
      ctx.fillStyle = "#c5b5ff";
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText(title.toUpperCase(), 90, 1260);
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial, sans-serif";
      ctx.fillText(href ? "OPEN WEBSITE  ↗" : "WEBSITE LINK COMING SOON", 90, 1310);
      texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      setReady({ preview, href, title, texture });
    };
    image.src = preview;
    return () => {
      cancelled = true;
      image.onload = null;
      texture?.dispose();
    };
  }, [preview, title, href]);
  return ready?.preview === preview && ready?.href === href && ready?.title === title ? ready.texture : null;
}
