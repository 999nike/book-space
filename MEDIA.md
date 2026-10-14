# Book media

Original recordings stay on WIZZ Media; the book references fixed same-origin media routes.

- Page 1 plays book-space/1.mp4, 3.mp4, 4.mp4 and 5.mp4 in order.
- Page 2 plays book-space/landing.mp4.
- Page 3 plays the existing Smokey Space preview.
- Page 4 plays book-space/universal.mp4.

New phone recordings hide the bottom 10% containing phone/cheat controls. The remaining frame is contained near the top of the video page. Original MP4s remain unchanged.

Each physical sheet now owns its artwork and video texture, matching the upstream book's per-sheet image binding. Only the settled spread plays. The outgoing video keeps playing during a turn; the requested incoming video can prepare a paused first frame. After every sheet's original bend/rotation has settled, playback moves to the incoming spread. Turn generations prevent rapid navigation from committing an old destination. Inactive pages retain their paused frames. Only the active page publishes playback controls.

The upstream bone animation, curve strengths, material shine and 50/150 ms page-stepping remain unchanged. Additional measurements detect when the turn has finished.

A compact Controls dropdown holds playback, Previous/Next and the website link. A separate page selector includes every page and both covers. Page clicks and arrow keys still turn the book.

Right pages use the user's supplied artwork. Artwork stays on the existing media/game hosts; fixed rewrites provide same-origin canvas access.
