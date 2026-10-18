import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH } from "./src/components/cover-dimensions.js";
const threeURL = process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : "three";
const THREE = await import(threeURL);
const source = (await readFile(new URL("./src/components/cover-backing.js", import.meta.url), "utf8"))
  .replace('from "three"', "from " + JSON.stringify(threeURL))
  .replace('from "./cover-dimensions.js"', "from " + JSON.stringify(new URL("./src/components/cover-dimensions.js", import.meta.url).href));
const { createCoverBacking } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const { BoxGeometry, Bone, Skeleton, SkinnedMesh, MeshBasicMaterial, Group, Vector3 } = THREE;
function page() {
  const geometry = new BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, 30, 2);
  geometry.translate(PAGE_WIDTH / 2, 0, 0);
  const indices = [], weights = [], bones = [];
  for (let i = 0; i < geometry.attributes.position.count; i++) {
    const along = Math.max(0, Math.min(30, geometry.attributes.position.getX(i) / PAGE_WIDTH * 30));
    const bone = Math.min(29, Math.floor(along)), weight = along - bone;
    indices.push(bone, bone + 1, 0, 0); weights.push(1 - weight, weight, 0, 0);
  }
  geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(indices, 4));
  geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
  for (let i = 0; i <= 30; i++) {
    const bone = new Bone(); bone.position.x = i ? PAGE_WIDTH / 30 : 0;
    if (i) bones[i - 1].add(bone);
    bones.push(bone);
  }
  const mesh = new SkinnedMesh(geometry, Array.from({ length: 6 }, () => new MeshBasicMaterial()));
  mesh.add(bones[0]); mesh.bind(new Skeleton(bones));
  return mesh;
}
function posedPoints(mesh) {
  const points = [];
  for (let i = 0; i < mesh.geometry.attributes.position.count; i++) points.push(mesh.getVertexPosition(i, new Vector3()).applyMatrix4(mesh.matrixWorld).toArray());
  return points;
}
let poses = 0;
for (const coverNumber of [0, 8]) for (const angle of [-Math.PI / 2, -0.8, 0, 0.8, Math.PI / 2]) {
  const mesh = page(), parent = new Group(), outer = new Group();
  parent.rotation.y = angle; parent.position.set(-0.6, 0.1, 0.03);
  outer.rotation.set(-Math.PI / 4, -Math.PI / 2, 0.03);
  outer.add(parent); parent.add(mesh);
  mesh.skeleton.bones.forEach((bone, i) => { bone.rotation.y = i ? Math.sin(i * 0.3) * 0.03 : 0; });
  outer.updateMatrixWorld(true); mesh.skeleton.update();
  const before = posedPoints(mesh);
  const bindMatrices = mesh.skeleton.boneInverses.map(matrix => matrix.elements.slice());
  const originalChildren = mesh.children.slice(), skeleton = mesh.skeleton;
  const backing = createCoverBacking(mesh, coverNumber, 9);
  outer.updateMatrixWorld(true); skeleton.update();
  assert.equal(backing.skeleton, skeleton);
  assert.equal(mesh.skeleton, skeleton);
  assert.deepEqual(mesh.skeleton.boneInverses.map(matrix => matrix.elements.slice()), bindMatrices, "binding the backing must not recalculate the page bind pose");
  assert.deepEqual(posedPoints(mesh), before, "adding cover thickness must leave every animated page vertex unchanged");
  assert.equal(originalChildren[0].parent, mesh, "the original root bone is never reparented");
  assert.ok(backing.matrixWorld.equals(mesh.matrixWorld), "shared skeletons use exactly the same animated world space");
  const outside = backing.material[coverNumber === 0 ? 4 : 5], original = mesh.material[coverNumber === 0 ? 4 : 5];
  assert.equal(outside.map, original.map, "the actual cover artwork is preserved");
  assert.equal(outside.roughnessMap, original.roughnessMap, "the holographic roughness map is preserved");
  assert.ok(outside.roughness >= 0.28);
  const attrs = backing.geometry.attributes;
  assert.ok(attrs.position.count < 1000, "backing stays light enough for phone rendering");
  for (let i = 0; i < attrs.position.count; i++) {
    const p = backing.getVertexPosition(i, new Vector3()).applyMatrix4(backing.matrixWorld);
    assert.ok(p.toArray().every(Number.isFinite), "cover animation must never produce NaN or bad bones");
    assert.ok(attrs.skinIndex.getY(i) <= 30);
    assert.ok(Math.abs(attrs.skinWeight.getX(i) + attrs.skinWeight.getY(i) - 1) < 1e-6);
    const z = attrs.position.getZ(i);
    assert.ok(coverNumber === 0 ? z > PAGE_DEPTH / 2 : z < -PAGE_DEPTH / 2, "backing is entirely outside the original page, never on top of the video");
  }
  backing.geometry.dispose(); mesh.geometry.dispose();
  poses++;
}
assert.equal(createCoverBacking(page(), 4, 9), null, "inner pages get no backing");
console.log("PASS: " + poses + " transformed cover poses preserve every original page vertex, skeleton, bind pose, outside artwork and valid weights; backing never occupies the video side.");

const bindingSource = (await readFile(new URL("./src/components/binding-geometry.js", import.meta.url), "utf8"))
  .replace('from "three"', "from " + JSON.stringify(threeURL))
  .replace('from "./cover-dimensions.js"', "from " + JSON.stringify(new URL("./src/components/cover-dimensions.js", import.meta.url).href));
const { createBindingFrame, createBindingGeometry, sampleBindingFrame, updateBindingGeometry } =
  await import("data:text/javascript;base64," + Buffer.from(bindingSource).toString("base64"));
const bindingGeometry = createBindingGeometry(), frame = createBindingFrame();
const root = new Group(), book = new Group(), frontGroup = new Group(), backGroup = new Group();
root.rotation.set(-Math.PI / 4, -0.2, 0.03); book.rotation.y = -Math.PI / 2;
root.add(book); book.add(frontGroup, backGroup);
const frontPage = page(), backPage = page();
frontGroup.add(frontPage); backGroup.add(backPage);
const edgeCounts = new Map(), index = bindingGeometry.index.array;
for (let i = 0; i < index.length; i += 3) for (let j = 0; j < 3; j++) {
  const pair = [index[i + j], index[i + (j + 1) % 3]].sort((a, b) => a - b).join(",");
  edgeCounts.set(pair, (edgeCounts.get(pair) || 0) + 1);
}
assert.ok([...edgeCounts.values()].every(count => count === 2), "spine sides and caps form a closed surface");
for (const [frontAngle, backAngle, currentPage] of [
  [Math.PI / 2, Math.PI / 2, 0], [0.65, 0.8, 1],
  [-0.07, 0.09, 4], [-0.8, -0.65, 8], [-Math.PI / 2, -Math.PI / 2, 9],
]) {
  frontGroup.rotation.y = frontAngle; backGroup.rotation.y = backAngle;
  frontPage.position.z = currentPage * PAGE_DEPTH;
  backPage.position.z = (currentPage - 8) * PAGE_DEPTH;
  root.updateMatrixWorld(true); frontPage.skeleton.update(); backPage.skeleton.update();
  const originalFront = posedPoints(frontPage), originalBack = posedPoints(backPage);
  sampleBindingFrame(frontPage, backPage, book, frame);
  updateBindingGeometry(bindingGeometry, frame);
  assert.deepEqual(posedPoints(frontPage), originalFront);
  assert.deepEqual(posedPoints(backPage), originalBack);
  const p = bindingGeometry.attributes.position, n = bindingGeometry.attributes.normal;
  for (let i = 0; i < p.count; i++) assert.ok([p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)].every(Number.isFinite));
  const height = 1.71 / 2 + 0.022 - 0.0025;
  const a = new Vector3().fromBufferAttribute(p, 0);
  const b = new Vector3().fromBufferAttribute(p, 12);
  assert.ok(a.distanceTo(frame.front.clone().addScaledVector(frame.up, -height)) < 1e-6, "spine starts exactly at the moving front-cover hinge");
  assert.ok(b.distanceTo(frame.back.clone().addScaledVector(frame.up, -height)) < 1e-6, "spine ends exactly at the moving back-cover hinge");
  assert.equal(updateBindingGeometry(bindingGeometry, frame), false, "steady book does not rebuild the spine each frame");
}
bindingGeometry.dispose();
console.log("PASS: watertight binding follows front and back hinges in closed, opening, open and back-closed poses without changing page transforms.");
