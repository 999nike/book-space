# Book media

The source repository contains links and player code only. Host the actual MP4s
on the existing WIZZ Media/Caddy server, not in this repository or a Vercel build.

| Book button | Clip | Hosted path |
| --- | --- | --- |
| Page 1 | Space Junkz gameplay | /book-space/junkz-game.mp4 |
| Page 2 | Junkz landing | /book-space/junkz-landing.mp4 |
| Page 3 | Smokey Space | /book-space/smokey-space.mp4 |

Media origin: https://media.w-i-z-z-lab-studios.com

Server folder: E:\WIZZ-Server\media\book-space

All three initial clips are eight-second H.264 MP4s, 1024 × 1368 at 25 fps.
The combined size is 1,823,442 bytes. Keep copies of these masters on the server.
Replace junkz-game.mp4 with better gameplay later using the same filename.

If the media server does not send cross-origin headers, fixed Vercel rewrites
provide same-origin access for the 3D video texture. The source stays on the media
server; fallback traffic passes through Vercel. A missing clip falls back to the
existing star preview. Retry or refresh the book after installing the files.
