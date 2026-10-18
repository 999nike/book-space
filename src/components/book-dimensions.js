export const PAGE_WIDTH = 1.28;
export const PAGE_HEIGHT = 1.71;
export const PAGE_DEPTH = 0.003;
export const COVER_DEPTH = 0.032;
export const COVER_OVERHANG = 0.035;
export const COVER_HEAD_OVERHANG = 0.028;
export const COVER_HINGE_OVERHANG = 0.012;

// Extra cover thickness faces out, keeping the inside flush with the original stack.
export function getCoverOffset(number, total) {
  const offset = (COVER_DEPTH - PAGE_DEPTH) / 2;
  return number === 0 ? offset : number === total - 1 ? -offset : 0;
}
