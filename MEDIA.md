# Book media

The MP4 originals stay on the user’s WIZZ Media server at E:\WIZZ-Server\media. Git and the Vercel build contain player code and URLs only. No originals were modified, trimmed or recompressed. Universal Space plays in full.

| Book button | Clip | Hosted filename |
| --- | --- | --- |
| Page 1 | Junkz start screen and level 1 | startscreenlvl1.mp4 |
| Page 2 | Junkz landing | junkz-landing.mp4 |
| Page 3 | Smokey Space | smokey-space.mp4 |
| Page 4 | Universal Space, complete original | universal-space.mp4 |
| Page 5 | Junkz map and hangar | map hangar.mp4 |
| Page 6 | Junkz Scorpion boss | scorpianboss.mp4 |
| Page 7 | Junkz M1 boss | m1boss.mp4 |
| Page 8 | Junkz M7 | m7.mp4 |

Media origin: https://media.w-i-z-z-lab-studios.com

Fixed same-origin Vercel rewrites provide access for the WebGL video texture because the media origin does not currently send cross-origin headers. Video storage remains on WIZZ Media; playback traffic passes through Vercel. The filename containing a space is URL encoded. Missing clips retain the existing star preview and Retry control.

Each video fills one continuous two-page spread, including the entire source frame. Only UV coordinates change; original page positions, skin weights, bones, material settings and turning animation remain unchanged. Covers and the final project index keep full-page UVs. The video opposite the final index uses one page.

Only one video element and decoder exist. Clicking a distant page loads only the selected clip while the original page-turn sequence animates. Hidden tabs and closed covers pause playback.
