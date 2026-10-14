# Book media

Video files stay on WIZZ Media, outside Git and the Vercel build.

- Page 1: /book-space/1.mp4 → 3.mp4 → 4.mp4 → 5.mp4, repeating in that order.
- Page 2: /book-space/landing.mp4.
- Pages 3 and 4 retain the existing Smokey Space and full Universal Space videos.

The new videos use cover fitting on the complete left page, with no borders or spine split. Aspect ratio is preserved; excess edges crop when the source and page ratios differ. Older clips retain their previous contained framing. Originals are unchanged.

Pages 1 and 2 have a Space Junkz graffiti title on the right. A native HTML website link is attached to the page's centre bone below the title, so it follows the page and opens normally in a new tab. The game page links to https://space-junkz-shooter.vercel.app/game.html and the landing page to https://junkz-shooter-landing.vercel.app/.

Previous/Next buttons and page clicks turn the book. The separate Open website button remains available below it. The original book shape, shine and turning animation are retained.

Fixed same-origin rewrites provide WebGL video access from https://media.w-i-z-z-lab-studios.com. Video storage remains on the user's server; proxy playback traffic passes through Vercel.
