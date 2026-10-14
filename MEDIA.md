# Book media

The source repository contains links and player code only. Host the actual MP4s
on the existing WIZZ Media/Caddy server, not in this repository or a Vercel build.

| Book button | Clip | Hosted path |
| --- | --- | --- |
| Page 1 | Space Junkz gameplay | /junkz-game.mp4 |
| Page 2 | Junkz landing | /junkz-landing.mp4 |
| Page 3 | Smokey Space | /smokey-space.mp4 |

Media origin: https://media.w-i-z-z-lab-studios.com

Server folder: E:\WIZZ-Server\media

All three initial clips are eight-second H.264 MP4s, 1024 × 1368 at 25 fps.
The combined size is 1,823,442 bytes. Keep copies of these masters on the server.
Replace junkz-game.mp4 with better gameplay later using the same filename.

If the media server does not send cross-origin headers, fixed Vercel rewrites
provide same-origin access for the 3D video texture. The source stays on the media
server; fallback traffic passes through Vercel. A missing clip falls back to the
existing star preview. Retry or refresh the book after installing the files.

Videos now form one continuous picture across each two-page spread: the left face samples the left half, and the right face samples the right half, from one shared video texture and decoder. Only UV coordinates change; vertex positions, skin weights, bones, material settings and turn animation remain upstream. The complete video frame fills the spread without cropping or borders. Portrait input widens to fill the spread; landscape input best matches the shape. The video beside the final index keeps its single-page framing.

Playback now starts with the verified same-origin media route. Videos stay on WIZZ Media; source files are not added to Git or the Vercel build. Material shader updates are skipped when the texture map has not changed.
