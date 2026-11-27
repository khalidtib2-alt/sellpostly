SellPostly Compact Split Preview

Extract into your existing SellPostly repository, preserving folder paths.
No new dependencies or configuration. Run npm test and npm run build.

The left Post Formatter panel now sizes to its content instead of stretching
to the storefront. Its editor has no forced minimum height or flex-fill area.
The URL bar has a labeled Electric Indigo Format button. SEO title, caption and
copy stay tightly grouped, and all four tabs stay vertical even on small screens.

The right panel now uses a three-column product row at 640px and above.
On narrow phones it shows one product. Previous/Next buttons cycle a sliding
window through six curated demo products, with a position counter and translated
accessible labels. There is no autoplay. Hover effects respect reduced motion.
Full-bleed photographs, green offer badges, five-star visuals, sample review
counts, and compact indigo deal buttons remain. The sample-offer notice remains.

Title and product-link edits return the carousel to the first synced product.
URL-based title recovery is instant and local; the Format action uses the existing
importer. Imported products do not inherit fake demo discounts or ratings.
All existing public routes and shop behavior remain unchanged. EN/FR/ES/AR and
RTL layout are retained. Panels adapt naturally to translated text and user edits;
no fixed equal height crops content or creates blank filler space.

Tests cover browsing/wrapping all six items, back navigation, title/import sync,
stale response protection, all locales, photographic assets and sample offers.
The React checks use Linkedom; full-browser pixel measurements were not run.

Local stock photograph provenance (existing Pexels library):
pexels-15246346.jpg: Cindy Bartillon
https://www.pexels.com/photo/a-black-leather-backpack-on-the-white-table-15246346/
pexels-13560373.jpg: Sandro Tavares
https://www.pexels.com/photo/a-person-wearing-white-sneakers-13560373/
pexels-9371408.jpg: Adrian Regeci
https://www.pexels.com/photo/a-person-holding-a-black-wireless-headphones-9371408/
pexels-7691110.jpg: ROMAN ODINTSOV
https://www.pexels.com/photo/close-up-shot-of-skincare-products-7691110/
pexels-26775343.jpg: Pexels contributor
https://www.pexels.com/photo/smartwatches-on-gray-background-26775343/
pexels-4349831.jpg: Ketut Subiyanto
https://www.pexels.com/photo/portafilter-and-coffee-machine-in-kitchen-4349831/
License: https://www.pexels.com/license/
