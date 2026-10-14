# Cover texture assets

Tool: built-in ImageGen. Output PNGs were converted to JPEG for the existing texture slots.
The original material settings, geometry and turning animation are unchanged.
The original blank `book-back.jpg` color map remains in use; it gains the new repeating lettering through the shared roughness map.

## Final files
- `public/textures/book-cover.jpg`: large supplied WIZZLAB logo and WIZZ LAB STUDIOS wording.
- `public/textures/book-cover-roughness.jpg`: repeating WIZZLAB / GAMES masks, producing the original reflective effect on both covers.
- `public/images/wizzlab-logo.png`: original user-supplied logo screenshot, used for the favicon.

## Front cover prompt

Use case: compositing. Asset: a FLAT portrait color texture for an existing Three.js book cover, not a mockup or a photograph of a book. Edit target image 1 is the original front-cover texture; image 2 is the user's exact WIZZLAB GAMES LTD logo, a supporting insert. Preserve image 1's existing dark charcoal top to violet bottom gradient, exact portrait 3:4 aspect ratio, and its simple centered composition. Remove every trace of WAVA SENSEI. Replace the large central white Wava mark with the faithful large WIZZLAB logo from image 2, retaining its angular graffiti lettering, blue/white/purple colors, Games LTD lettering, and outline shapes. Extract just the logo from the source screenshot, omit its rectangular space background and the tiny cut-off green shape at the top. Place this large logo centered around the middle of the cover, about 78 percent of cover width. Beneath it, add the exact text 'WIZZ LAB STUDIOS' in clean bold white uppercase. Keep all other areas the original smooth gradient. No repeated background logos, no rendered holographic lighting, no baked reflections, no borders or new slogans: the existing 3D material creates the shine using a separate roughness map. Output one flat portrait texture, ideally 1536x2048.

## Reflective lettering prompt

Use case: text-localization. Edit target: the supplied flat monochrome technical roughness-map image used by an existing Three.js book material. Keep it a flat strictly black-and-white portrait texture with the same 3:4 aspect ratio. Replace EVERY tiled 'WAVA SENSEI' logo with the exact uppercase lettering 'WIZZLABGAMES'. Preserve the original staggered repeating grid: approximately three marks per row and seven rows down the image, with alternating horizontal offsets and partial marks cropped at the left and right edges. Render each repeated mark as two tightly grouped lines, 'WIZZLAB' above 'GAMES', together reading WIZZLABGAMES. Use bold solid black geometric sans-serif lettering on pure white, matching the original thick block logo weight and overall footprint. Black lettering and white negative space only. Do not draw outline lettering in this technical map: the unchanged existing material makes these masks appear hollow and reflective on the cover. Remove all Wava shapes and wording. No colored gradients, simulated lighting, paper texture, borders, centered large logo, or other content. Output one flat monochrome technical texture, ideally 1536x2048.
