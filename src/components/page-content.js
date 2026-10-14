import { HOSTED_VIDEO_URL, TEST_VIDEO_FALLBACK } from "./video-controller.js";

export const BOOK_SHEETS = 9;

export const projects = [
  { title: "Space Junkz", detail: "PLAY THE GAME", href: "https://space-junkz-shooter.vercel.app/game.html" },
  { title: "Junkz", detail: "THE LANDING PAGE", href: "https://junkz-shooter-landing.vercel.app/" },
  { title: "Smokey Space", detail: "EXPLORE THE WORLD", href: "https://smokey-space.vercel.app/" },
];

// Each sheet has a front and a back; reserve only the final inside face for the index.
export function getPageContent(number, total) {
  return {
    front: number === 0 ? "cover" : number === total - 1 ? "index" : "video",
    back: number === total - 1 ? "cover" : "video",
  };
}
export function isBookOpen(page, total) {
  return page > 0 && page < total;
}

const MEDIA_ORIGIN = "https://media.w-i-z-z-lab-studios.com";
export const STAR_VIDEO = { id: "stars", label: "Star book video", url: HOSTED_VIDEO_URL, fallback: TEST_VIDEO_FALLBACK };
const spreadVideos = {
  1: { id: "junkz-game", label: "Space Junkz gameplay", url: MEDIA_ORIGIN + "/junkz-game.mp4", fallback: "/test-media/junkz-game.mp4", backup: TEST_VIDEO_FALLBACK },
  2: { id: "junkz-landing", label: "Junkz landing", url: MEDIA_ORIGIN + "/junkz-landing.mp4", fallback: "/test-media/junkz-landing.mp4", backup: TEST_VIDEO_FALLBACK },
  3: { id: "smokey-space", label: "Smokey Space", url: MEDIA_ORIGIN + "/smokey-space.mp4", fallback: "/test-media/smokey-space.mp4", backup: TEST_VIDEO_FALLBACK },
};
export function getSpreadVideo(page) {
  return spreadVideos[page] || STAR_VIDEO;
}
