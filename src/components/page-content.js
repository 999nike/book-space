import { HOSTED_VIDEO_URL, TEST_VIDEO_FALLBACK } from "./video-controller.js";

export const BOOK_SHEETS = 9;

export const projects = [
  { title: "Space Junkz", detail: "PLAY THE GAME", href: "https://space-junkz-shooter.vercel.app/game.html" },
  { title: "Junkz", detail: "THE LANDING PAGE", href: "https://junkz-shooter-landing.vercel.app/" },
  { title: "Smokey Space", detail: "EXPLORE THE WORLD", href: "https://smokey-space.vercel.app/" },
  { title: "WIZZ Online", detail: "EXPLORE WIZZ", href: "https://cloud-w-i-z-z.vercel.app/" },
  { title: "WIZZ Glass Lab", detail: "ENTER THE LAB", href: "https://wizz-glass-lab.vercel.app/table.html" },
];

// Each sheet has a front and a back; reserve only the final inside face for the index.
export function getPageContent(number, total) {
  return {
    front: number === 0 ? "cover" : number === total - 1 ? "index" : number === total - 2 ? "stars" : "preview",
    back: number === total - 1 ? "cover" : "video",
  };
}
export function isBookOpen(page, total) {
  return page > 0 && page < total;
}

const MEDIA_ORIGIN = "https://media.w-i-z-z-lab-studios.com";
export const STAR_VIDEO = { id: "stars", label: "Star book video", fit: "cover", url: HOSTED_VIDEO_URL, fallback: TEST_VIDEO_FALLBACK };
const hostedClip = (id, label, filename = id + ".mp4") => ({
  id,
  label,
  url: MEDIA_ORIGIN + "/" + encodeURIComponent(filename),
  fallback: "/test-media/" + id + ".mp4",
});
const bookClip = (id, label, filename) => ({
  ...hostedClip(id, label),
  url: MEDIA_ORIGIN + "/book-space/" + encodeURIComponent(filename),
  fit: "page",
  cropBottom: 0.10,
});
const junkzClips = [1, 3, 4, 5].map(number => ({
  ...bookClip("junkz-" + number, "Space Junkz · Clip " + number, number + ".mp4"),
  // Keep the final 3D recording whole; earlier clips are short previews.
  ...(number === 5 ? {} : { maxDuration: 15 }),
}));
const spreadVideos = {
  1: { ...junkzClips[0], id: "junkz-showreel", label: "Space Junkz showreel", clips: junkzClips },
  2: bookClip("book-landing", "Junkz landing", "landing.mp4"),
  3: bookClip("cmd-centre", "Smokey Space", "cmd-centre.mp4"),
  4: bookClip("book-universal", "Universal Space", "universal.mp4"),
  5: { ...hostedClip("wizzonline", "WIZZ Online"), fit: "page", cropTop: 0.12, cropBottom: 0.065 },
  6: { ...hostedClip("wizz-glass-labs", "WIZZ Glass Lab"), fit: "page", cropTop: 0.12, cropBottom: 0.06 },
};
export function getSpreadVideo(page) {
  return spreadVideos[page] || STAR_VIDEO;
}

const spreadProjects = {
  1: { ...projects[0], branding: "wizz", preview: "/project-art/space-junkz-title.png", edition: "SPACE JUNKZ SHOOTER" },
  2: { ...projects[1], branding: "artwork", preview: "/project-art/junkz-landing.png" },
  3: { ...projects[2], branding: "artwork", preview: "/project-art/smokeys-space.png" },
  4: { title: "Universal Space", branding: "artwork", preview: "/project-art/universal-space.png", href: null },
  5: { ...projects[3], branding: "artwork", preview: "/project-art/wizz-double.png", artworkHalf: "right" },
  6: { ...projects[4], branding: "artwork", preview: "/project-art/wizz-double.png", artworkHalf: "left" },
};
export function getSpreadProject(page) {
  return spreadProjects[page] || null;
}
