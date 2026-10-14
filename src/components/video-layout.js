// Each face uses a complete frame. Positions, skin weights and page-turn bones stay upstream.
export function applyVideoPageUVs(geometry, originalUV) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, originalUV.getX(i), originalUV.getY(i));
  }
  uv.needsUpdate = true;
}

// Contain the full source inside one page, leaving extra room next to the spine.
export function fitPageFrame(sourceWidth, sourceHeight, width, height, side = "left", fit = "contain") {
  if (fit === "page") {
    const scale = Math.min(width * 0.98 / sourceWidth, height * 0.98 / sourceHeight);
    return { x: (width - sourceWidth * scale) / 2, y: height * 0.01, width: sourceWidth * scale, height: sourceHeight * scale };
  }
  if (fit === "cover") {
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    return { x: (width - sourceWidth * scale) / 2, y: (height - sourceHeight * scale) / 2, width: sourceWidth * scale, height: sourceHeight * scale };
  }
  const left = width * (side === "left" ? 0.04 : 0.16);
  const right = width * (side === "left" ? 0.16 : 0.04);
  const top = height * 0.035;
  const availableWidth = width - left - right;
  const availableHeight = height - top * 2;
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
  const frameWidth = sourceWidth * scale;
  const frameHeight = sourceHeight * scale;
  return { x: left + (availableWidth - frameWidth) / 2, y: top, width: frameWidth, height: frameHeight };
}
