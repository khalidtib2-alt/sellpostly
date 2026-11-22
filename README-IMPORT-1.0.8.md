# SellPostly Product Import 1.0.8

Apply this source patch after SellPostly-Portrait-Product-Cards-Patch.zip. The complete chrome-extension folder is included, as is a standalone SellPostly-Extension-1.0.8.zip (manifest at ZIP root). Extract that ZIP into a fresh folder and use Chrome Extensions > Developer mode > Load unpacked, or replace/reload your existing extension folder. Confirm version 1.0.8. No new extension permissions are requested.

Run npm install for the new LinkeDOM development-only test dependency, then npm run build and npm test. No database migration or API keys are required for this change. Do not replace your environment settings.

## Extraction

The isolated page reader checks current visible buy-box prices before metadata/JSON-LD fallbacks, excludes hidden and crossed-out values, recognizes currency-before/after amounts and locale separators, and retries briefly for delayed DOM content. It supports Amazon, Temu-style prices, AliExpress, Jumia and generic microdata/OpenGraph/Product offers (price and lowPrice). It never supplies a default $29. If no trustworthy value is found, the editable field stays empty. Review variant, shipping/tax, location and currency differences before sending.

Main image selection prefers product gallery nodes, lazy data-src, srcset, Amazon data-old-hires/dynamic image sizes, Product.image and og:image, and large visible product photos over small thumbnails. Price and image fields are editable. Manual edits are retained during the automatic fill performed by Send to My Shop.

## Seller choice

Amazon/Temu/AliExpress/Jumia and other valid image URLs now survive the extension bridge, studio, shop save and shared storefront validation. Amazon CDN image URLs are not stripped or forcibly replaced. The seller gets the translated non-blocking notice: Amazon Associates Notice: Verify image usage rights or replace with your own/studio photo before publishing.

The studio and shop image picker still offer optional stock/studio/upload alternatives. Already-custom photos are not automatically replaced. This software does not grant image rights or guarantee affiliate-program compliance. Existing Amazon static-price/discount safeguards, affiliate disclosures, catalog separation, payment policies and EN/FR/AR with RTL remain intact. Source photos are never sent to Gemini by this import flow.

## API pipeline

The existing /api/import-product route keeps its SSRF/DNS/redirect protections and can now preserve a validated public image URL if downloading its pixels is refused. Product OpenGraph price amount/currency are used when Product offers lack them. /api/import is a compatibility alias. This checkout saves product catalogs through /api/shops; there is no separate /api/products route to modify. Both studio and shop handoffs use the shared product normalization.

Some stores block server scraping or render prices in protected frames, canvas or delayed content. The extension reads only the active page DOM under activeTab/scripting. Importing after choosing a variant and allowing the page to load is best. A browser can still refuse an image download or Canvas access through CORS; its URL remains available for review and replacement rather than being blocked by SellPostly.

## Verification

npm run build completed with zero errors. npm test: 132 passed, zero failed or skipped. Added deterministic DOM fixtures for Temu, AliExpress, Jumia, Amazon and generic structured data, currency parsing, high-resolution image selection, and both catalog handoffs including long Amazon image URLs. LinkeDOM provides real selector/DOM parsing; fixture visibility/geometry are explicitly modeled, not a claim of live-site browser testing. Chromium could not launch in this environment, so no live-store browser session was used. Existing tests that asserted mandatory image blocking were updated to assert seller-controlled retention; price/disclosure and security checks remain.

The prior Windows workspace was unavailable here. The available older Linux checkout was restored with the saved patch sequence before implementation. Four recovered legacy regression tests are included in this test total. Changes were built in this restored workspace, with no production deployment, real store modification or live database write.
