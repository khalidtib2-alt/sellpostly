# Affiliate representative photos

This update adds generic photo matching to Affiliate imports, the Affiliate product editor, and published Affiliate storefronts. It leaves Personal Seller checkout and uploaded seller photos intact.

## Setup

No photo API key is required. Twenty real JPEG photographs are bundled under public/stock-photos/, with two alternatives for each required category. Source pages and license references are recorded in public/stock-photos/SOURCES.json.

Optional server environment variables:

- PEXELS_API_KEY: search Pexels first.
- UNSPLASH_ACCESS_KEY: search Unsplash if Pexels is unavailable or returns no usable results.

Set these on the server only, then rebuild/redeploy. Never place provider keys in NEXT_PUBLIC_ variables or Chrome extension files.

GET /api/affiliate/stock-photo?q=kids%20sneakers returns safe photo metadata. Imported brands, model numbers, SKUs, and arbitrary URLs are replaced by a bounded generic category query before contacting either provider. Failed, empty, or unconfigured providers use the bundled JPEG pool. Search results are cached for 30 minutes.

## Seller workflow

1. Import a product into Affiliate Deals Shop with extension 1.0.5, or add/edit an Affiliate product in My Shop.
2. SellPostly assigns a representative category photo automatically if no custom photo exists. Raw Amazon CDN images and previous automatic SVG placeholders are replaced.
3. In the item editor, use Next Similar Photo or a photo thumbnail to select an alternative. Upload Custom Photo still takes priority.
4. Public Affiliate cards label stock images as Representative style photo and link to source credits. Stock provenance is saved with the product and preserved in shared catalogs.

These are style illustrations using real photographs, not guaranteed photographs of the exact branded item. Generic search terms and text filters cannot certify that every provider image is free of trademarks. Review visible logos, product accuracy, the source license, and any additional rights before publishing. Use your own review photo for an exact product match. Photos do not imply a manufacturer endorsement.

Pexels source links and license information accompany the bundled images. Unsplash API images retain their returned hotlink URLs and photographer attribution; selecting an Unsplash image records the required download event through the server. Provider keys and tracking endpoints are never sent to the extension.

Amazon destination links retain affiliate tags. Amazon static prices/discount badges remain hidden, Check Price on Amazon is retained with nofollow sponsored noopener, and the editable affiliate disclosure stays prominent.

## Extension

The bundle contains SellPostly-Extension-1.0.5.zip. Extract it, then load the chrome-extension directory through chrome://extensions with Developer mode enabled. Remove an older copy first if Chrome shows more than one SellPostly extension. The version shown must be 1.0.5. The configured frontend is https://sellpostly.vercel.app; vercel.com remains blocked. No new extension permissions were added.

## Verification

npm run build
npm test

The patch includes regression coverage for generic query parity, real JPEG assets, provider failure and secret handling, Unsplash selection tracking, saved/shared photo metadata, custom-image preservation, Amazon safeguards, and extension handoff.
