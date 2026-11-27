SellPostly Studio Usability Fixes

Apply this focused update over your current SellPostly repository (including the
Studio Sources update). Preserve folders, run npm test and npm run build, deploy
normally, then reload the unpacked Chrome extension at chrome://extensions.
No dependencies, API keys or database migrations added.

Handoff:
- Studio accepts image/img/src/productImage query parameters even without a title.
- Reads canonical and legacy Studio handoff keys from localStorage/sessionStorage,
  plus extension messages and a main-world pending bridge for late page mounts.
- Consumed query fields are removed while unrelated parameters/hash are preserved.
- Studio data URLs can remain intact up to 12MB of encoded text, without the shop
  catalog's shorter persistence limit being applied prematurely.
- The extension preserves data images, supports image-only Studio handoffs, and
  posts to the page even if local/session storage is full.
- Successful merchant images now show Image ready to edit instead of the old
  Upload an image to begin placeholder.

Images load directly with anonymous CORS first. If blocked, Studio tries the new
same-origin /api/studio/image?url=... route. That proxy validates public HTTP(S)
addresses and every redirect, pins the DNS result, excludes private IP ranges,
uses time/size limits, sends no user credentials, and accepts only signature-
checked PNG/JPEG/WebP responses. It cannot bypass merchant authentication or
anti-bot restrictions; upload a local copy if both paths are blocked.

Instant Cutout now defaults to tolerance 16 and uses local gradient/edge barriers.
Only reached background pixels are feathered; protected product pixels retain
exact original RGBA. Background swatches redraw behind the stored cutout and do
not re-run segmentation. Completely indistinguishable white-on-white contours
cannot be recovered reliably by flood-fill: use Restore Original, AI Cutout or
manual cropping for such photos. No universal never-erodes guarantee is claimed.

Interactive Crop Box:
Click the clearly labeled toggle for the original image, eight square corner/edge
handles, drag-to-move, and the dimmed outside area. Compare mode switches back to
the edited view. Pointer/touch drags and Crop X/Y/Width/Height sliders update the
same normalized crop state. Preset ratios and opposite anchors remain constrained.
Existing image sources, cutout choices, backdrops, export, video/QR tools, selected-
shop publishing, enlarged preview and compact homepage are preserved.

EN/FR/ES/AR labels included. npm run build passed with 0 errors and all 201 npm
tests passed. New tests exercise aliases/data images, extension storage failure,
proxy DNS pinning/private redirects/raster validation, light product contours,
eight-handle geometry, image-ready status, proxy loading and slider/preset sync.
UI tests use mocked images/canvas in Linkedom; real merchant access remains
subject to each merchant's availability. No production deployment was performed.
