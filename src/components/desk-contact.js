import { Vector3 } from "three";

// Only the display group's height changes. Page bones, hinges and camera framing are untouched.
export function settleBookOnDesk(root, covers, cache, surfaceY = 0) {
  const sheets = [covers.front, covers.back];
  if (sheets.some(sheet => !sheet)) return false;
  const signature = sheets.flatMap(sheet => [
    sheet.position.z, sheet.parent.rotation.x, sheet.parent.rotation.y, sheet.parent.rotation.z,
    ...sheet.skeleton.bones.flatMap(bone => [bone.rotation.x, bone.rotation.y, bone.rotation.z]),
  ]);
  if (cache.signature && signature.every((value, i) => Math.abs(value - cache.signature[i]) < 1e-6)) return false;
  cache.signature = signature;
  root.parent?.updateWorldMatrix(true, false);
  root.updateMatrixWorld(true);
  const point = cache.point ||= new Vector3();
  let lowest = Infinity;
  for (const sheet of sheets) {
    const backing = sheet.children.find(child => child.name.endsWith("cover-backing"));
    const surface = backing || sheet;
    for (let i = 0; i < surface.geometry.attributes.position.count; i++) {
      surface.getVertexPosition(i, point).applyMatrix4(surface.matrixWorld);
      lowest = Math.min(lowest, point.y);
    }
  }
  if (!Number.isFinite(lowest)) return false;
  root.position.y += surfaceY + 0.006 - lowest;
  root.updateMatrixWorld(true);
  return true;
}
