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

Each spread now has a complete, uncropped video on the left and a static website preview on the right. The video is contained within a single page with a small spine gutter; wide footage is letterboxed instead of stretched. Portrait footage naturally fills more of the page. The video page canvas redraws only on decoded video frames (or time changes on older browsers), with mipmaps disabled.

The right page opens the corresponding website in a new tab. A keyboard-accessible Visit site link provides the same action. Page controls and arrow keys still turn pages; covers, index, original geometry, bones, material shine and page-turn animation remain intact. Universal Space stays on Page4 uncut; its website link is pending the user-provided public URL.

Small still-image previews are included in the app. All video originals remain on the media server. Only one video element and decoder exist; hidden tabs and closed covers pause playback.
