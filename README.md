# Book Space — The Project Book

A static Three.js showroom with curved, animated book pages. Junkz gameplay is the first page; its landing page is the second. Smokey Space is the following chapter. The scene background is deliberately simple for a later table-and-tea treatment.

Run node serve.mjs from this folder and visit http://127.0.0.1:5173.

## Videos

The supplied URLs are websites, not video files. No recordings were supplied. The animated artwork is explicitly labelled a concept preview. To add actual clips, put MP4 or WebM files in dist/videos and set each project's video property in dist/projects.js. The current chapter can also preview a local video via the Add video control; that selection is temporary and is never uploaded. Muted autoplay, play/pause, sound, fullscreen, chapter navigation, and pausing hidden clips are supported. For remote clips, the media server must permit CORS. Each project’s actual website is linked.

## Rendering and accessibility

Three.js loads from a pinned CDN version. If it cannot load or WebGL is unavailable, a CSS book fallback preserves chapters, video previews, and links. Keyboard arrows turn pages. Reduced motion is respected. The modal has keyboard focus containment and Escape support.

## Credits

Book concept inspired by https://github.com/pakagronglb/animated-book-slider-threejs and the Wawa Sensei tutorial credited there. This implementation uses original page geometry and materials; no source assets or code were copied from that repository.

## Verification

Syntax checks and the DOM/media interaction harness pass: run npm run check. The local server returns HTTP 200 for the main page and assets. Actual WebGL visuals, mobile layout, real codec playback, and fullscreen require a connected browser and were not visually verified in this session. Hosting source synchronization was blocked by an unreachable git.chatgpt-team.site server; the registered site remains unpublished.
