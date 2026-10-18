import assert from "node:assert/strict";
import { getBookFitDistance } from "./src/components/book-framing.js";
import { PAGE_WIDTH, PAGE_HEIGHT, COVER_OVERHANG, COVER_HEAD_OVERHANG } from "./src/components/book-dimensions.js";

const viewports = [[390, 844], [430, 932], [844, 390], [1366, 768], [1920, 1080]];
let corners = 0;
for (const [width, height] of viewports) for (const direction of [[-0.5, 1, 4], [0, 0, 1], [2, 2, 3]]) {
  const length = Math.hypot(...direction), view = direction.map(x => x / length);
  const rightLength = Math.hypot(view[0], view[2]);
  const right = [view[2] / rightLength, 0, -view[0] / rightLength];
  const up = [view[1] * right[2], view[2] * right[0] - view[0] * right[2], -view[1] * right[0]];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
  const closed = getBookFitDistance({ width, height, direction });
  const opened = getBookFitDistance({ width, height, direction, opened: true });
  assert.ok(Number.isFinite(closed) && closed > 0);
  assert.ok(opened >= closed * 1.05, "opening always includes a gentle pullback");
  for (const [isOpen, distance] of [[false, closed], [true, opened]]) {
    for (const x of isOpen ? [-PAGE_WIDTH - COVER_OVERHANG, PAGE_WIDTH + COVER_OVERHANG] : [-PAGE_WIDTH / 2 - COVER_OVERHANG, PAGE_WIDTH / 2 + COVER_OVERHANG]) {
      for (const y of [-PAGE_HEIGHT / 2 - COVER_HEAD_OVERHANG, PAGE_HEIGHT / 2 + COVER_HEAD_OVERHANG]) for (const z of isOpen ? [-0.35, 0.35] : [-0.06, 0.06]) {
        const point = [x, (y + z) / Math.sqrt(2), (z - y) / Math.sqrt(2)];
        const depth = distance - dot(point, view);
        const pixelX = width / 2 + dot(point, right) / depth / Math.tan(Math.PI / 8) * height / 2;
        const pixelY = height / 2 - dot(point, up) / depth / Math.tan(Math.PI / 8) * height / 2;
        assert.ok(pixelX >= 12 && pixelX <= width - 12, "both page edges fit in " + width + "x" + height);
        assert.ok(pixelY >= 48 && pixelY <= height - 48, "top and bottom clear the controls");
        corners++;
      }
    }
  }
}
const phone = getBookFitDistance({ width: 390, height: 844, opened: true });
const desktop = getBookFitDistance({ width: 1920, height: 1080, opened: true });
assert.ok(phone > desktop, "portrait screens pull back further to fit both pages");
assert.ok(Number.isFinite(getBookFitDistance({ width: 390, height: 844, direction: [0, 0, 0], opened: true })));
console.log("PASS: " + corners + " projected corners fit across phone portrait, phone landscape and desktop; opening pullback and toolbar clearance verified.");
