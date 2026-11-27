SellPostly Luxury Homepage Showcase Update

Extract into your existing SellPostly repository, preserving folder paths.
No new dependencies or environment settings. Run npm test and npm run build.

Updated the shared HomeShowcase component: four full-bleed local photographic
cards, varied sample prices and original prices, 42/55/35/48-percent badges,
individual sample ratings/review counts, a demo curator badge, and a refined
dark editorial header. Equal card rows align the CTAs across mobile and desktop.
Hover elevation/zoom respects reduced-motion preferences. All text supports
English, French, Spanish and Arabic with RTL and logical spacing.

The first card mirrors the editable SEO title immediately. Pasting a product
URL derives a readable title locally without a network request. Clicking import
uses the existing API, updating title, caption, photo and price when available.
Stale responses cannot overwrite later edits. The first linked/imported card
hides invented demo ratings and discounts; missing prices say Check Live Price.
All cards keep the existing /shop builder destination. The illustrative preview
notice remains visible. This does not publish or modify any seller catalog.

Verification: npm run build passed with 0 errors; all 190 npm tests passed.
New tests cover coherent demo offers, local JPEG assets, localization, safe URL
handling, mounted React title/link/import updates, and stale import protection.
The interactive tests use Linkedom; no full browser screenshot test was run.

Existing local Pexels photographs (original provenance retained in stock pool):
pexels-15246346: Cindy Bartillon
https://www.pexels.com/photo/a-black-leather-backpack-on-the-white-table-15246346/
pexels-13560373: Sandro Tavares
https://www.pexels.com/photo/a-person-wearing-white-sneakers-13560373/
pexels-9371408: Adrian Regeci
https://www.pexels.com/photo/a-person-holding-a-black-wireless-headphones-9371408/
pexels-7691110: ROMAN ODINTSOV
https://www.pexels.com/photo/close-up-shot-of-skincare-products-7691110/
License: https://www.pexels.com/license/
