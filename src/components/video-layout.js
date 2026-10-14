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
