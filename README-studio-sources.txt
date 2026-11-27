SellPostly Studio Sources + Large Preview Update

Extract into your existing SellPostly repository, preserving folder paths.
No new dependencies, API keys or server endpoints. Run npm test / npm run build.

Studio now starts with three source choices:
1. File upload/drop plus global Ctrl+V / Command+V image paste. Plain-text paste
   is not intercepted. Accepts PNG/JPEG/WebP up to 25 MB / 40 megapixels.
2. Free browser search against Openverse, falling back to Wikimedia Commons on
   error or no usable results. Includes category chips, source/license links,
   cancellation and timeouts. Search filters to public-domain/CC0 results.
3. Bundled curated product/lifestyle photographs across six categories, with
   source credits. These work without remote API access.

Photos are validated and prepared locally (up to 2400px longest edge) before
being loaded into the existing editor. Remote images must permit browser CORS;
if they do not, choose another image or upload a local copy. Searches depend on
provider availability and anonymous API limits. No server image proxy is used.
Public-domain metadata is not a guarantee of trademark/model/property rights;
source links are available for the seller to review.

The default edited canvas now uses the full sticky left column, up to 540px.
Expand / Zoom widens the column from 7 to 8 grid spans, up to 620px preview height.
Crop Original switches to the existing corner-drag crop canvas; it is not
remounted, so controls and preview state remain intact. Before/after comparison,
Instant Cutout, AI Cutout, backdrop swatches, export, badges, watermarks, video/QR
and Send to Selected Shop remain connected to the same rendering pipeline.

The homepage keeps its 176px photo preview and Edit in Studio handoff, including
when only a photo is provided. The compact homepage carousel, Format button,
vertical tabs and content-sized panels remain included. EN/FR/ES/AR preserved.

Verification: npm run build completed with 0 errors; all 194 npm tests passed.
New mocked-provider and mounted React tests cover API fallback/cancellation,
public-domain result filtering, local galleries, clipboard handling, selected
photo loading, listener cleanup and preview expansion/crop preservation.
Live public-provider availability and full-browser visual checks were not run.

Runtime AI remains opt-in (Transformers.js 3.7.2 / Xenova MODNet q8, Apache-2.0).
This update includes all existing bundled photo assets used by the gallery.
Photo credits and source/license links:
/stock-photos/pexels-5022533.jpg — Rishi
https://www.pexels.com/photo/a-person-wearing-white-sneakers-5022533/
https://www.pexels.com/license/
/stock-photos/pexels-13560373.jpg — Sandro Tavares
https://www.pexels.com/photo/a-person-wearing-white-sneakers-13560373/
https://www.pexels.com/license/
/stock-photos/pexels-27174555.jpg — José Martin Segura Benites
https://www.pexels.com/photo/sandal-with-high-heel-27174555/
https://www.pexels.com/license/
/stock-photos/pexels-27100529.jpg — José Martin Segura Benites
https://www.pexels.com/photo/close-up-of-shoes-27100529/
https://www.pexels.com/license/
/stock-photos/pexels-5275386.jpg — Pexels contributor
https://www.pexels.com/photo/close-up-of-little-girl-reaching-to-her-shoes-5275386/
https://www.pexels.com/license/
/stock-photos/pexels-37117672.jpg — Gizem Gökce
https://www.pexels.com/photo/child-s-feet-in-sneakers-on-grass-37117672/
https://www.pexels.com/license/
/stock-photos/pexels-30428610.jpg — Vladislav Anchuk
https://www.pexels.com/photo/black-studio-headphones-on-white-background-30428610/
https://www.pexels.com/license/
/stock-photos/pexels-9371408.jpg — Adrian Regeci
https://www.pexels.com/photo/a-person-holding-a-black-wireless-headphones-9371408/
https://www.pexels.com/license/
/stock-photos/pexels-26775343.jpg — Pexels contributor
https://www.pexels.com/photo/smartwatches-on-gray-background-26775343/
https://www.pexels.com/license/
/stock-photos/pexels-35500160.jpg — Pexels contributor
https://www.pexels.com/photo/stylish-smartwatches-displayed-on-natural-background-35500160/
https://www.pexels.com/license/
/stock-photos/pexels-13869858.jpg — Pexels contributor
https://www.pexels.com/photo/a-black-backpack-on-white-surface-13869858/
https://www.pexels.com/license/
/stock-photos/pexels-15246346.jpg — Cindy Bartillon
https://www.pexels.com/photo/a-black-leather-backpack-on-the-white-table-15246346/
https://www.pexels.com/license/
/stock-photos/pexels-4349831.jpg — Ketut Subiyanto
https://www.pexels.com/photo/portafilter-and-coffee-machine-in-kitchen-4349831/
https://www.pexels.com/license/
/stock-photos/pexels-36040629.jpg — Pew Nguyen
https://www.pexels.com/photo/vintage-espresso-machine-on-kitchen-counter-36040629/
https://www.pexels.com/license/
/stock-photos/pexels-8155163.jpg — Alesia Kozik
https://www.pexels.com/photo/overhead-shot-of-dumbbells-a-clipboard-and-a-water-bottle-8155163/
https://www.pexels.com/license/
/stock-photos/pexels-4793244.jpg — Anete Lusina
https://www.pexels.com/photo/set-of-sports-equipment-near-modern-headset-4793244/
https://www.pexels.com/license/
/stock-photos/pexels-7691110.jpg — ROMAN ODINTSOV
https://www.pexels.com/photo/close-up-shot-of-skincare-products-7691110/
https://www.pexels.com/license/
/stock-photos/pexels-7691168.jpg — ROMAN ODINTSOV
https://www.pexels.com/photo/close-up-shot-of-skincare-products-7691168/
https://www.pexels.com/license/
/stock-photos/pexels-28396251.jpg — Pexels contributor
https://www.pexels.com/photo/minimalist-workspace-keyboard-and-mouse-setup-28396251/
https://www.pexels.com/license/
/stock-photos/pexels-34030131.jpg — Pexels contributor
https://www.pexels.com/photo/minimalist-wireless-keyboard-and-mouse-setup-34030131/
https://www.pexels.com/license/
/stock-photos/pexels-29999843.jpg — Pexels contributor
https://www.pexels.com/photo/stylish-leather-boots-on-dark-background-29999843/
https://www.pexels.com/license/
/stock-photos/pexels-292999.jpg — Pexels contributor
https://www.pexels.com/photo/pair-of-black-dress-shoes-292999/
https://www.pexels.com/license/
/stock-photos/pexels-6387628.jpg — Pexels contributor
https://www.pexels.com/photo/stylish-decorated-ballet-flats-placed-on-glass-table-6387628/
https://www.pexels.com/license/
