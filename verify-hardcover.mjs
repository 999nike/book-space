import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { PAGE_WIDTH, PAGE_HEIGHT, PAGE_DEPTH, COVER_DEPTH, getCoverOffset } from "./src/components/book-dimensions.js";

const three = process.argv[2] ? pathToFileURL(resolve(process.argv[2])).href : "three";
const source = (await readFile(new URL("./src/components/hardcover-geometry.js", import.meta.url), "utf8"))
  .replace('from "three"', "from " + JSON.stringify(three))
  .replace('from "./book-dimensions.js"', "from " + JSON.stringify(new URL("./src/components/book-dimensions.js", import.meta.url).href));
const { createHardcoverGeometry } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
const geometry = createHardcoverGeometry();
const { position, normal, uv, skinIndex, skinWeight } = geometry.attributes;
const edges = new Map();
const point = i => [position.getX(i), position.getY(i), position.getZ(i)];
const key = p => p.map(x => Math.round(x * 1e6)).join(",");
for (let i = 0; i < position.count; i++) {
  assert.ok([...point(i), normal.getX(i), normal.getY(i), normal.getZ(i), uv.getX(i), uv.getY(i)].every(Number.isFinite));
  assert.ok(Math.abs(skinWeight.getX(i) + skinWeight.getY(i) - 1) < 1e-6);
  assert.ok(skinIndex.getX(i) >= 0 && skinIndex.getY(i) <= 30, "overhang never references nonexistent bone 31");
}
for (let i = 0; i < position.count; i += 3) {
  const vertices = [point(i), point(i + 1), point(i + 2)];
  for (let j = 0; j < 3; j++) {
    const edge = [key(vertices[j]), key(vertices[(j + 1) % 3])].sort().join("|");
    edges.set(edge, (edges.get(edge) || 0) + 1);
  }
}
assert.ok([...edges.values()].every(count => count === 2), "board is watertight, including corners and bevel");
assert.equal(geometry.groups.reduce((sum, group) => sum + group.count, 0), position.count);
for (const group of geometry.groups.filter(group => group.materialIndex >= 4)) {
  for (let i = group.start; i < group.start + group.count; i++) {
    assert.ok(uv.getX(i) >= -1e-6 && uv.getX(i) <= 1 + 1e-6 && uv.getY(i) >= -1e-6 && uv.getY(i) <= 1 + 1e-6, "whole artwork fits the inset");
    assert.ok(group.materialIndex === 4 ? normal.getZ(i) > 0.99 : normal.getZ(i) < -0.99, "front and back have correct winding");
  }
}
assert.ok(geometry.boundingBox.max.x > PAGE_WIDTH && geometry.boundingBox.max.y > PAGE_HEIGHT / 2);
assert.ok(Math.abs(geometry.boundingBox.max.z - geometry.boundingBox.min.z - COVER_DEPTH) < 1e-6);
assert.ok(Math.abs(getCoverOffset(0, 9) - COVER_DEPTH / 2 + PAGE_DEPTH / 2) < 1e-8, "front inside cover remains flush");
assert.ok(Math.abs(getCoverOffset(8, 9) + COVER_DEPTH / 2 - PAGE_DEPTH / 2) < 1e-8, "back inside cover remains flush");
assert.equal(getCoverOffset(4, 9), 0);
geometry.dispose();
console.log("PASS: watertight beveled boards, valid bone weights, full artwork UVs, correct face winding and flush inner covers.");
