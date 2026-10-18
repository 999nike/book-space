import { BufferGeometry, Float32BufferAttribute, Matrix4, Vector3 } from "three";
import { PAGE_HEIGHT, PAGE_DEPTH, COVER_HEAD_OVERHANG, COVER_HINGE_OVERHANG, COVER_DEPTH } from "./cover-dimensions.js";

const SEGMENTS = 12, RING = (SEGMENTS + 1) * 2;
export function createBindingFrame() {
  return { front: new Vector3(), back: new Vector3(), outward: new Vector3(), up: new Vector3(), other: new Vector3(), inverse: new Matrix4() };
}
export function sampleBindingFrame(front, back, parent, frame) {
  parent.updateWorldMatrix(true, false);
  frame.inverse.copy(parent.matrixWorld).invert();
  const a = front.skeleton.bones[0], b = back.skeleton.bones[0];
  a.updateWorldMatrix(true, false); b.updateWorldMatrix(true, false);
  const z = PAGE_DEPTH / 2 + 0.0005 + COVER_DEPTH;
  frame.front.set(-COVER_HINGE_OVERHANG, 0, z).applyMatrix4(a.matrixWorld).applyMatrix4(frame.inverse);
  frame.back.set(-COVER_HINGE_OVERHANG, 0, -z).applyMatrix4(b.matrixWorld).applyMatrix4(frame.inverse);
  frame.outward.set(-1, 0, 0).transformDirection(a.matrixWorld).transformDirection(frame.inverse);
  frame.other.set(-1, 0, 0).transformDirection(b.matrixWorld).transformDirection(frame.inverse);
  frame.outward.add(frame.other).normalize();
  frame.up.set(0, 1, 0).transformDirection(a.matrixWorld).transformDirection(frame.inverse);
  return frame;
}
export function createBindingGeometry() {
  const geometry = new BufferGeometry(), indices = [];
  geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(RING * 2 * 3), 3));
  for (let i = 0; i < RING; i++) {
    const next = (i + 1) % RING;
    indices.push(i, next, RING + i, next, RING + next, RING + i);
  }
  geometry.addGroup(0, indices.length, 0);
  const capsStart = indices.length;
  // Cap each ribbon segment directly; a centre fan would overlap this curved profile.
  for (let i = 0; i < SEGMENTS; i++) {
    const inner = RING - 1 - i, nextInner = inner - 1;
    indices.push(i, inner, i + 1, i + 1, inner, nextInner);
    indices.push(RING + i, RING + i + 1, RING + inner, RING + i + 1, RING + nextInner, RING + inner);
  }
  geometry.addGroup(capsStart, indices.length - capsStart, 1);
  geometry.setIndex(indices);
  return geometry;
}
export function updateBindingGeometry(geometry, frame) {
  const signature = [...frame.front.toArray(), ...frame.back.toArray(), ...frame.outward.toArray(), ...frame.up.toArray()];
  const previous = geometry.userData.bindingFrame;
  if (previous && signature.every((value, i) => Math.abs(value - previous[i]) < 1e-6)) return false;
  geometry.userData.bindingFrame = signature;
  const positions = geometry.attributes.position;
  const height = PAGE_HEIGHT / 2 + COVER_HEAD_OVERHANG - 0.0025;
  const bow = Math.max(0.009, Math.min(0.022, frame.front.distanceTo(frame.back) * 0.4));
  const thickness = 0.003, point = new Vector3();
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < RING; i++) {
      const outer = i <= SEGMENTS;
      const t = outer ? i / SEGMENTS : (RING - 1 - i) / SEGMENTS;
      point.lerpVectors(frame.front, frame.back, t)
        .addScaledVector(frame.outward, Math.sin(t * Math.PI) * bow - (outer ? 0 : thickness))
        .addScaledVector(frame.up, side ? height : -height);
      positions.setXYZ(side * RING + i, point.x, point.y, point.z);
    }
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return true;
}
