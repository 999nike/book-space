import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { drawWizzBrand } from "./WizzBrand";

export function usePreviewPageTexture(project) {
  const [ready, setReady] = useState(null);
  const { preview, title, href, info, branding, edition, artworkHalf } = project || {};
  useEffect(() => {
    if (!preview && !branding) return;
    let cancelled = false, texture = null;
    const image = new Image();
    const paint = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1368;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (branding === "artwork") {
        const sourceWidth = artworkHalf ? image.naturalWidth / 2 : image.naturalWidth;
        const sourceX = artworkHalf === "right" ? sourceWidth : 0;
        // Split the supplied double artwork without clipping either logo.
        const scale = artworkHalf
          ? Math.min(canvas.width / sourceWidth, canvas.height / image.naturalHeight)
          : Math.max(canvas.width / sourceWidth, canvas.height / image.naturalHeight);
        const width = sourceWidth * scale, height = image.naturalHeight * scale;
        ctx.fillStyle = "#03040b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, sourceX, 0, sourceWidth, image.naturalHeight, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      } else if (branding === "wizz") {
        drawWizzBrand(ctx, image, edition);
      } else {
        ctx.fillStyle = "#090b18";
        ctx.fillRect(0, 0, 1024, 1368);
        const bounds = info ? { x: 160, y: 180, width: 824, height: 400 } : { x: 160, y: 32, width: 824, height: 1180 };
        const scale = Math.min(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight);
        const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
        ctx.drawImage(image, bounds.x + (bounds.width - width) / 2, bounds.y + (bounds.height - height) / 2, width, height);
        ctx.fillStyle = "#c5b5ff";
        ctx.font = "bold 24px Arial, sans-serif";
        ctx.fillText(title.toUpperCase(), 170, info ? 110 : 1260);
        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial, sans-serif";
        if (info) {
          ctx.fillStyle = "#c5b5ff";
          ctx.font = "bold 24px Arial, sans-serif";
          ctx.fillText("THREE CONNECTED APPS", 170, 650);
          ctx.fillStyle = "#fff";
          info.split("\n").forEach((line, index) => {
            ctx.font = ["Universal Space", "Office", "Code Space"].includes(line) ? "bold 29px Arial, sans-serif" : "26px Arial, sans-serif";
            ctx.fillText(line, 170, 720 + index * 46);
          });
          ctx.fillStyle = "#c5b5ff";
          ctx.font = "22px Arial, sans-serif";
          ctx.fillText("WIZZ LAB STUDIOS  /  PROJECT NOTES", 170, 1310);
        } else {
          ctx.fillText("OPEN WEBSITE USING THE BUTTON BELOW", 170, 1310);
        }
      }
      texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      setReady({ preview, href, title, info, branding, edition, artworkHalf, texture });
    };
    image.onload = paint;
    image.src = preview;
    return () => {
      cancelled = true;
      image.onload = null;
      texture?.dispose();
    };
  }, [preview, title, href, info, branding, edition, artworkHalf]);
  return ready && ready.preview === preview && ready.href === href && ready.title === title && ready.info === info && ready.branding === branding && ready.edition === edition && ready.artworkHalf === artworkHalf ? ready.texture : null;
}
