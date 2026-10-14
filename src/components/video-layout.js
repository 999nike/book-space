export const PAGE_ASPECT = 1.28 / 1.71;
export const SPREAD_ASPECT = PAGE_ASPECT * 2;

export function getVideoCrop(width, height, targetAspect = SPREAD_ASPECT) {
  const videoAspect = width / height;
  if (!(videoAspect > 0) || !Number.isFinite(videoAspect)) {
    return { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 };
  }
  const repeatX = videoAspect > targetAspect ? targetAspect / videoAspect : 1;
  const repeatY = videoAspect < targetAspect ? videoAspect / targetAspect : 1;
  return { repeatX, repeatY, offsetX: (1 - repeatX) / 2, offsetY: (1 - repeatY) / 2 };
}

// Only UV coordinates change. Positions, skin weights and page-turn bones stay upstream.
export function applyVideoPageUVs(geometry, originalUV, content, panoramic = true) {
  const uv = geometry.attributes.uv;
  for (const group of geometry.groups) {
    if (group.materialIndex !== 4 && group.materialIndex !== 5) continue;
    const side = group.materialIndex === 4 ? "front" : "back";
    const split = panoramic && content[side] === "video";
    for (let index = group.start; index < group.start + group.count; index++) {
      const vertex = geometry.index ? geometry.index.getX(index) : index;
      const u = originalUV.getX(vertex);
      uv.setXY(vertex, split ? u * 0.5 + (side === "front" ? 0.5 : 0) : u, originalUV.getY(vertex));
    }
  }
  uv.needsUpdate = true;
}
