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
const hostedClip = (id, label, filename = id + ".mp4") => ({
  id,
  label,
  url: MEDIA_ORIGIN + "/" + encodeURIComponent(filename),
  fallback: "/test-media/" + id + ".mp4",
  backup: TEST_VIDEO_FALLBACK,
});
const junkzClips = [
  hostedClip("startscreenlvl1", "Space Junkz · Start screen & level 1"),
  hostedClip("m1boss", "Space Junkz · M1 boss"),
  hostedClip("m7", "Space Junkz · M7"),
  hostedClip("scorpianboss", "Space Junkz · Scorpion boss"),
  hostedClip("map-hangar", "Space Junkz · Map & hangar", "map hangar.mp4"),
];
const spreadVideos = {
  1: { ...junkzClips[0], id: "junkz-showreel", label: "Space Junkz showreel", clips: junkzClips },
  2: hostedClip("junkz-landing", "Junkz landing"),
  3: hostedClip("smokey-space", "Smokey Space"),
  4: hostedClip("universal-space", "Universal Space"),
};
export function getSpreadVideo(page) {
  return spreadVideos[page] || STAR_VIDEO;
}
