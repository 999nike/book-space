import { PAGE_WIDTH, PAGE_HEIGHT, COVER_OVERHANG, COVER_HEAD_OVERHANG } from "./cover-dimensions.js";
// Reserve space for the cover backing as well as the original bend and gentle Float.
const floatAngles = [[0, 0, 0]];
for (const x of [-0.125, 0.125]) for (const y of [-0.125, 0.125]) for (const z of [-0.05, 0.05]) floatAngles.push([x, y, z]);

function fitDistance(width, height, fov, direction, opened) {
  const length = Math.hypot(...direction) || 1;
  const [dx, dy, dz] = direction.map(value => value / length);
  const rightLength = Math.hypot(dx, dz);
  const right = rightLength > 0.0001 ? [dz / rightLength, 0, -dx / rightLength] : [1, 0, 0];
  const up = [dy * right[2], dz * right[0] - dx * right[2], -dy * right[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const verticalTangent = Math.tan(fov * Math.PI / 360);
  const horizontalTangent = verticalTangent * width / height;
  const horizontalSpace = Math.max(0.25, 1 - 24 / width) * 0.98;
  const verticalSpace = Math.max(0.25, 1 - 96 / height) * 0.98;
  const halfWidth = (opened ? PAGE_WIDTH : PAGE_WIDTH / 2) + COVER_OVERHANG;
  const halfDepth = opened ? 0.35 : 0.055;
  let distance = 0;

  for (const [rx, ry, rz] of floatAngles) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    for (const x of [-halfWidth, halfWidth]) for (const y of [-PAGE_HEIGHT / 2 - COVER_HEAD_OVERHANG, PAGE_HEIGHT / 2 + COVER_HEAD_OVERHANG]) for (const z of [-halfDepth, halfDepth]) {
      // Float's small XYZ rotation, followed by its existing -45 degree resting angle.
      const x1 = x * cz - y * sz, y1 = x * sz + y * cz;
      const x2 = x1 * cy + z * sy, z2 = -x1 * sy + z * cy;
      const y2 = y1 * cx - z2 * sx, z3 = y1 * sx + z2 * cx;
      const point = [x2, (y2 + z3) * Math.SQRT1_2, (-y2 + z3) * Math.SQRT1_2];
      const depth = dot(point, [dx, dy, dz]) + 0.06;
      distance = Math.max(distance,
        depth + (Math.abs(dot(point, right)) + 0.035) / (horizontalTangent * horizontalSpace),
        depth + (Math.abs(dot(point, up)) + 0.05) / (verticalTangent * verticalSpace));
    }
  }
  return distance;
}

export function getBookFitDistance({ width, height, fov = 45, direction = [-0.5, 1, 4], opened = false }) {
  width = Math.max(1, width);
  height = Math.max(1, height);
  if (Math.hypot(...direction) < 0.0001) direction = [0, 0, 1];
  const closed = fitDistance(width, height, fov, direction, false);
  // Always retain a small opening pullback, even on wide screens limited by height.
  return opened ? Math.max(closed * 1.05, fitDistance(width, height, fov, direction, true)) : closed;
}
