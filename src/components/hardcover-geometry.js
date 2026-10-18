import { BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute } from "three";
import { PAGE_WIDTH, PAGE_HEIGHT, COVER_DEPTH, COVER_OVERHANG, COVER_HEAD_OVERHANG, COVER_HINGE_OVERHANG } from "./book-dimensions.js";

// Solid boards with inset artwork, a dark border, rounded corners and a narrow bevel.
// Face material slots match the original pages, keeping video and artwork bindings intact.
export function createHardcoverGeometry(segments = 30) {
  const geometry = new BufferGeometry();
  const positions = [], uvs = [], skinIndices = [], skinWeights = [];
  const bevel = 0.004, corner = 0.016, halfDepth = COVER_DEPTH / 2;
  const outline = (left, right, bottom, top, radius, z) => {
    const points = [];
    for (const [cx, cy, angle] of [
      [right - radius, bottom + radius, -Math.PI / 2],
      [right - radius, top - radius, 0],
      [left + radius, top - radius, Math.PI / 2],
      [left + radius, bottom + radius, Math.PI],
    ]) {
      for (let i = 0; i <= 6; i++) {
        const theta = angle + i * Math.PI / 12;
        points.push([cx + radius * Math.cos(theta), cy + radius * Math.sin(theta), z]);
      }
    }
    return points;
  };
  const left = -COVER_HINGE_OVERHANG, right = PAGE_WIDTH + COVER_OVERHANG;
  const top = PAGE_HEIGHT / 2 + COVER_HEAD_OVERHANG, bottom = -top;
  const rings = [
    outline(0, PAGE_WIDTH, -PAGE_HEIGHT / 2, PAGE_HEIGHT / 2, 0.006, halfDepth),
    outline(left + bevel, right - bevel, bottom + bevel, top - bevel, corner - bevel, halfDepth),
    outline(left, right, bottom, top, corner, halfDepth - bevel),
    outline(left, right, bottom, top, corner, -halfDepth + bevel),
    outline(left + bevel, right - bevel, bottom + bevel, top - bevel, corner - bevel, -halfDepth),
    outline(0, PAGE_WIDTH, -PAGE_HEIGHT / 2, PAGE_HEIGHT / 2, 0.006, -halfDepth),
  ];
  const vertex = (point, back = false) => {
    positions.push(...point);
    uvs.push(back ? 1 - point[0] / PAGE_WIDTH : point[0] / PAGE_WIDTH, point[1] / PAGE_HEIGHT + 0.5);
    // Overhangs stay attached to the nearest valid end bone.
    const along = Math.max(0, Math.min(segments, point[0] / PAGE_WIDTH * segments));
    const bone = Math.min(segments - 1, Math.floor(along)), weight = along - bone;
    skinIndices.push(bone, bone + 1, 0, 0);
    skinWeights.push(1 - weight, weight, 0, 0);
  };
  const triangle = (a, b, c, back = false) => { vertex(a, back); vertex(b, back); vertex(c, back); };
  const face = (ring, material, back) => {
    const start = positions.length / 3, center = [PAGE_WIDTH / 2, 0, ring[0][2]];
    ring.forEach((point, i) => {
      const next = ring[(i + 1) % ring.length];
      if (back) triangle(center, next, point, true);
      else triangle(center, point, next);
    });
    geometry.addGroup(start, positions.length / 3 - start, material);
  };
  face(rings[0], 4, false);
  face(rings[5], 5, true);
  [1, 0, 1, 0, 1].forEach((material, band) => {
    const start = positions.length / 3, a = rings[band], b = rings[band + 1];
    a.forEach((point, i) => {
      const next = (i + 1) % a.length;
      triangle(point, b[i], a[next]);
      triangle(a[next], b[i], b[next]);
    });
    geometry.addGroup(start, positions.length / 3 - start, material);
  });
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(skinWeights, 4));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
