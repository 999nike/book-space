# Hardback backing trial

Original rollback pin: branch `backup/original-book-before-hardback`, commit `5da80d06ee58a0edfd732ac3a4c413d8e31c7103`. Do not move this backup branch. Main/production stays on that original version until the trial is approved.

The rejected trial changed the first/last page's rotation rules into rigid root hinges. The upstream book distributes the page angle through a bone chain; changing that root rotation changes the presentation as well as the silhouette. This is a code finding; we have not reproduced the user's reversed appearance in a connected browser.

This retry preserves the original paper geometry, front/back textures, frame-loop rotation code, turn order and video bindings. Two slim backing meshes are added outside the original cover surfaces. Each is an identity-transform child bound to the existing skeleton and bind matrix, so it follows the same animation rather than inventing another pivot. The outer surface reuses the actual cover material. A dark violet edge and small overhang create the hardback profile.

The preview defaults to a steady view: no floating or opening zoom; camera fits the open book from the start. Add `?motion=on` to compare the normal cinematic presentation. Inner page bending remains enabled in both views.

Research:
- [Upstream Book.jsx](https://github.com/pakagronglb/animated-book-slider-threejs/blob/main/src/components/Book.jsx): original distributed turning and physical page order.
- [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html): shared skeletons, attached bind mode and explicit bind matrices.
- [Three.js Object3D](https://threejs.org/docs/pages/Object3D.html): child transforms and parent/world transform relationships.
- [Three.js BoxGeometry](https://threejs.org/docs/pages/BoxGeometry.html): subdivided geometry used to keep backing skinning light.

Verification: video, playback and framing regressions; real Three.js transformed-pose checks confirm adding the backing leaves every original page vertex, root bone and inverse bind matrix unchanged. No browser is connected in this session, so visual approval still comes from testing the preview.
