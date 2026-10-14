# Book media

All MP4 originals stay on the user’s WIZZ Media server at E:\WIZZ-Server\media. Git and the Vercel build contain player code and URLs only. No originals were modified, trimmed or recompressed. Universal Space plays in full on Page 4.

| Spread | Content | Hosted filename |
| --- | --- | --- |
| Page 1, clip 1 | Junkz start screen and level 1 | startscreenlvl1.mp4 |
| Page 1, clip 2 | Junkz M1 boss | m1boss.mp4 |
| Page 1, clip 3 | Junkz M7 | m7.mp4 |
| Page 1, clip 4 | Junkz Scorpion boss | scorpianboss.mp4 |
| Page 1, clip 5 | Junkz map and hangar | map hangar.mp4 |
| Page 2 | Junkz landing | junkz-landing.mp4 |
| Page 3 | Smokey Space | smokey-space.mp4 |
| Page 4 | Universal Space, complete original | universal-space.mp4 |

Page 1 automatically plays all five Junkz originals in this sequence, then repeats the sequence. Other videos loop individually. Open clip follows the currently playing file. The final inside face remains the project index.

Media origin: https://media.w-i-z-z-lab-studios.com

Fixed same-origin Vercel rewrites provide access for the WebGL video texture because the media origin does not currently send cross-origin headers. Video storage remains on WIZZ Media; playback traffic passes through Vercel. Filenames containing spaces are URL encoded. Missing clips retain the existing star preview and Retry control.

Each video fills one continuous two-page spread, including the entire source frame. Original page positions, skin weights, bones, material settings and turning animation remain unchanged. Only one video element and decoder exist; the selected clip loads without downloading intermediate pages during a jump. Hidden tabs and closed covers pause playback.
