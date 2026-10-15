import { useEffect, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { projects } from "./page-content";

export function useIndexPageTexture() {
  const [texture, setTexture] = useState(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1368;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const background = ctx.createLinearGradient(0, 0, 1024, 1368);
    background.addColorStop(0, "#141023");
    background.addColorStop(1, "#403080");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 1024, 1368);
    for (let i = 0; i < 95; i++) {
      const x = (i * 379 + 53) % 1024;
      const y = (i * 593 + 79) % 1368;
      ctx.fillStyle = i % 4 === 0 ? "#d6c7ff88" : "#ffffff35";
      ctx.beginPath();
      ctx.arc(x, y, i % 4 === 0 ? 2 : 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#c5b5ff";
    ctx.font = "bold 25px Arial, sans-serif";
    ctx.fillText("WIZZ LAB STUDIOS", 95, 135);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 92px Arial, sans-serif";
    ctx.fillText("THE INDEX", 90, 290);
    ctx.fillStyle = "#d2c6ed";
    ctx.font = "27px Arial, sans-serif";
    ctx.fillText("Games, worlds & other ideas.", 95, 350);
    const rowGap = Math.min(208, 580 / Math.max(1, projects.length - 1));
    projects.forEach((project, i) => {
      const y = 500 + i * rowGap;
      ctx.fillStyle = "#ba9fff";
      ctx.font = "28px Arial, sans-serif";
      ctx.fillText(String(i + 1).padStart(2, "0"), 95, y);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px Arial, sans-serif";
      ctx.fillText(project.title, 175, y);
      ctx.fillStyle = "#c6bbdd";
      ctx.font = "22px Arial, sans-serif";
      ctx.fillText(project.detail, 175, y + 46);
      ctx.strokeStyle = "#ffffff30";
      ctx.beginPath();
      ctx.moveTo(95, y + 89);
      ctx.lineTo(925, y + 89);
      ctx.stroke();
    });
    ctx.fillStyle = "#d2c6ed";
    ctx.font = "23px Arial, sans-serif";
    ctx.fillText("Open a project using the index links.", 95, 1240);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    setTexture(map);
    return () => map.dispose();
  }, []);
  return texture;
}
