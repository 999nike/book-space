import { BoxGeometry, Float32BufferAttribute, Uint16BufferAttribute, SkinnedMesh, MeshStandardMaterial, Vector3 } from "three";
import { PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, COVER_OVERHANG, COVER_HEAD_OVERHANG, COVER_HINGE_OVERHANG, COVER_DEPTH } from "./cover-dimensions.js";

const rimMaterial = new MeshStandardMaterial({
  color: "#432476", metalness: 0.5, roughness: 0.32,
  emissive: "#271145", emissiveIntensity: 0.12,
});
const liningMaterial = new MeshStandardMaterial({ color: "#070918", roughness: 0.5 });

// Backing only: never replaces a page surface, skeleton, pivot, UV or turning rule.
export function createCoverBacking(pageMesh, number, total) {
  if (number !== 0 && number !== total - 1) return null;
  const front = number === 0, segments = pageMesh.skeleton.bones.length - 1;
  const width = PAGE_WIDTH + COVER_OVERHANG + COVER_HINGE_OVERHANG;
  const height = PAGE_HEIGHT + 2 * COVER_HEAD_OVERHANG;
  const geometry = new BoxGeometry(width, height, COVER_DEPTH, segments, 4, 2);
  const position = geometry.attributes.position, normal = geometry.attributes.normal;
  const point = new Vector3(), inner = new Vector3(), delta = new Vector3();
  const radius = 0.0025;
  const half = [width / 2, height / 2, COVER_DEPTH / 2];
  const centerX = (PAGE_WIDTH + COVER_OVERHANG - COVER_HINGE_OVERHANG) / 2;
  const centerZ = (front ? 1 : -1) * (PAGE_DEPTH / 2 + 0.0005 + COVER_DEPTH / 2);
  const indices = [], weights = [];
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i);
    inner.set(...point.toArray().map((value, axis) => Math.max(-half[axis] + radius, Math.min(half[axis] - radius, value))));
    delta.copy(point).sub(inner).normalize();
    point.copy(inner).addScaledVector(delta, radius);
    normal.setXYZ(i, delta.x, delta.y, delta.z);
    point.x += centerX; point.z += centerZ;
    position.setXYZ(i, point.x, point.y, point.z);
    const along = Math.max(0, Math.min(segments, point.x / PAGE_WIDTH * segments));
    const bone = Math.min(segments - 1, Math.floor(along)), weight = along - bone;
    indices.push(bone, bone + 1, 0, 0);
    weights.push(1 - weight, weight, 0, 0);
  }
  geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const outside = pageMesh.material[front ? 4 : 5].clone();
  // Broaden the outer-cover highlight while retaining the supplied holographic roughness map.
  outside.roughness = Math.max(outside.roughness ?? 0.1, 0.28);
  outside.envMapIntensity = 0.72;
  const mesh = new SkinnedMesh(geometry, [
    rimMaterial, rimMaterial, rimMaterial, rimMaterial,
    front ? outside : liningMaterial, front ? liningMaterial : outside,
  ]);
  mesh.name = front ? "front-cover-backing" : "back-cover-backing";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  // Identity child transform gives the backing exactly the page's animated world space.
  pageMesh.add(mesh);
  mesh.bind(pageMesh.skeleton, pageMesh.bindMatrix);
  return mesh;
}
