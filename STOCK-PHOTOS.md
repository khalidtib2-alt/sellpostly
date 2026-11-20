# Affiliate stock photos: Amazon-only automatic rules

Automatic Amazon restrictions are enabled only for products in Affiliate Deals when the destination is an Amazon domain, amzn.to, or amzn.eu, or when a product image uses the Amazon CDN. Lookalike domains do not match.

## Behavior

- Affiliate + Amazon-related: replace raw Amazon CDN images with subtype-matched representative stock photos; hide static prices and discount badges. Amazon destinations keep Check Price on Amazon. A non-Amazon merchant reusing a CDN photo keeps View Best Deal pointing to that merchant.
- Affiliate + other merchant: keep the imported image and price, including after saving and sharing. Missing images stay empty. Automatic matching is disabled. Sellers may still upload their own photo, use Next Similar Photo, or choose a thumbnail manually.
- Personal Store: keep the original imported image (including Amazon CDN) and normal prices. No Amazon image blocking, automatic stock matching or price hiding runs in Personal mode.

The extension follows the same destination rules. Only Affiliate imports strip raw Amazon CDN photos. A small provenance flag allows the website to assign the replacement and hide static prices after the CDN URL has been removed from the handoff. Personal and ordinary merchant photos remain in the payload. Affiliate URL tags remain intact.

Previously discarded merchant photos cannot be recovered from a stock photo automatically; re-import the original product if its source image was already removed by an older version.

## Photo resolver

Twenty-three real JPEGs are bundled under public/stock-photos/. Sources and license links are in SOURCES.json. Optional server-only PEXELS_API_KEY and UNSPLASH_ACCESS_KEY enable provider searches; unconfigured or unavailable providers fall back to the bundled pool. Never put these keys in NEXT_PUBLIC_ variables or extension code.

Athletic sneakers, boots, formal shoes, flats and sandals have distinct fallback tags. Kids athletic sneakers use two kids sneaker photographs, never the removed bow flat. Provider results with incorrect or ambiguous footwear subtype descriptions are rejected. The shared website/extension generic query removes brand and model details from photo searches.

Stock photos are labeled Representative style photo, with source credits. They are not guaranteed photos of the exact branded product. Review visible logos, accuracy, licenses and any additional permissions before publishing. Custom seller uploads take priority. Unsplash selections retain hotlinks, attribution and server-side download tracking.

## Install and verify

Merge this patch into the existing SellPostly repository. Extract the included SellPostly-Extension-1.0.5.zip and reload its chrome-extension folder at chrome://extensions. No new dependencies, permissions or database migrations are required.

Run npm run build and npm test. EN/FR/AR labels remain supported.
