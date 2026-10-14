# Original project and credits

Based on [pakagronglb/animated-book-slider-threejs](https://github.com/pakagronglb/animated-book-slider-threejs)
by Pakagrong Lebel, starting at commit 3dd1a49855e7f74f4a2b86c705910d7284cc5c52.
The upstream author credits [Wawa Sensei](https://www.youtube.com/watch?v=b7a_Y1Ja6js)
and the [React Three Fiber course](https://lessons.wawasensei.dev/course).
The original README and attribution are retained.

The book geometry, skeleton, turning animation, original material settings,
camera, floating motion, environment and lights are preserved. Cover artwork
and the shared roughness texture now carry WIZZ LAB STUDIOS branding.
The original blank back-cover color texture uses the new repeating WIZZLABGAMES
roughness map to retain its reflective lettering effect.

The inside faces share one externally hosted video and one video decoder.
The final inside face is a project index. No video files are committed here. The media player first requests the public WIZZ Media URL.
If cross-origin loading fails, a fixed Vercel rewrite proxies that same clip
for this test. This fallback sends video traffic through Vercel; it does not
store the source video in Git. Remove the fallback after the media origin
allows cross-origin requests from the production book domain.

Cover artwork was edited with the built-in ImageGen tool; see COVER-ASSETS.md.

The first three spreads now select externally hosted clips: Space Junkz gameplay,
the Junkz landing page, and Smokey Space. These MP4 files belong in
E:\WIZZ-Server\media and are not committed to this repository.
A single decoder is replaced when the selected clip changes. If a project clip
is unavailable, the existing star preview remains available and the controls
offer Retry. The book geometry, materials and turning animation are unchanged.

Videos now form one continuous picture across each two-page spread: the left face samples the left half, and the right face samples the right half, from one shared video texture and decoder. Only UV coordinates change; vertex positions, skin weights, bones, material settings and turn animation remain upstream. The spread uses aspect-preserving cover cropping. Portrait clips crop vertically; landscape footage suits the wider spread. The video beside the final index keeps its single-page framing.
