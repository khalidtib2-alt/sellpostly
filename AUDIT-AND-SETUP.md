# SellPostly: Complete Polish and Lookbook Patch

This is a replacement-file patch for the existing SellPostly repository. Back up your checkout, then merge the ZIP contents into its root. It includes the earlier $49/month B2B update, so that tier remains available even if you have not applied the separate pricing patch.

## Apply and configure

1. Merge src/, public/, tests/ and chrome-extension/ into the existing repository. Do not load the partial chrome-extension folder from this ZIP as a standalone extension; merge it into your existing extension folder and reload that unpacked extension.
2. NEXT_PUBLIC_B2B_PLAN_PRICE is optional and defaults to 49. The existing Polygon USDC/USDT subscription checkout, wallet configuration, admin review and license issuance remain in use. Renewals are manual every 30 days; there are no automatic wallet debits.
3. Run `npm run db:init` using your existing private database configuration. The idempotent schema supports the B2B monthly plan and Spanish subscription/upgrade-request language values. Approval of B2B access lasts 30 days, not lifetime. Existing records are retained.
4. Run `npm run build` and `npm test`, then deploy through your normal workflow. No live database migration, payment, email or deployment was performed while preparing this patch.

## Audit results

- The homepage retains its original hero, Seller/Creator formatter modes, uploads and Studio handoff, Seller Guides, social links and Chrome Extension callout. A three-card creator/brand/agency section links to the existing B2B pricing card.
- Ten bundled fallback photo files referenced by existing catalog code were missing from the local checkout and are included. Existing custom product photos are not replaced.
- The original theme surfaces and current white/slate colors are retained. Every accent offered by the theme picker now has variables: Emerald, Ocean Blue, Sunset Amber, Royal Violet and Rose Coral. The existing additional Indigo variables are retained. Responsive grids, compact card image frames, accessibility focus styles and reduced-motion behavior remain available.
- `/s/[slug]`, `/s/[slug]/personal`, `/s/[slug]/affiliate`, existing public product pages and local product previews remain in place. Peer checkout, crypto checkout, buyer order form and cart drawer code are unchanged from the starting working build. Product landing changes add Spanish to its language choices without changing cart or checkout bindings.
- The earlier B2B checkout, price-resolution helper and 30-day license issuance behavior are preserved. Personal direct payments are separate from that subscription checkout.

## Completed features

- Native Spanish for all 1,347 website translation keys, plus all 144 extension message/template keys. EN/FR/ES/AR switchers preserve LTR for Spanish and RTL for Arabic. Spanish is also supported in copy-generation input, creator drafts, SEO metadata, email receipts and WhatsApp quick replies.
- Store Manager has Save Draft and Publish Live Shop controls at the top and bottom. Drafts are local; publishing explicitly calls the existing authenticated shop API. Failed publishing keeps the draft. Status distinguishes unpublished, saved and published states and handles edits or shop switches during a request. Publishing does not force the share window open.
- The representative-style/Next Similar Photo block and automatic editor photo-search effect are removed. Existing saved photos and catalog data remain usable. Direct image URL, custom upload, Official Brand Media Kit, Wikimedia Commons and Unsplash research links remain.
- `/prompt-generator` redirects to `/?tab=prompt#formatter`. The integrated, vertical Prompt Generator tab creates editable SEO title, meta description, search keywords, buyer FAQ, social caption, hashtags and a reusable prompt. It works locally with verified input; no external generation is claimed. The separate existing Gemini Content Creator remains available. Header navigation also switches the tab when the homepage is already mounted.
- Blocked product pages fall back to an honest title derived from the URL and marketplace detection for Temu, AliExpress, Amazon, Shopify or Other. Missing price, currency, features and photo stay empty for seller review. HTTP/HTTPS validation, DNS/private-address checks, pinned fetch addresses, redirect checks and size/time limits remain enforced. Store homepages still require a product page if their Shopify featured-product endpoint is unavailable.
- Storefront hero photos follow the current category, audience and search filters. New products have a preserved creation timestamp; legacy catalogs retain their existing ordering when no timestamp exists. An empty filter never borrows an unrelated hero photo.
- Affiliate buyer footers omit the dispute form and retain third-party fulfillment and SaaS neutrality notices. Personal Store disputes remain available. Existing affiliate destinations, disclosures, Amazon price/CTA safeguards and image-rights reminders are preserved. Cards have restrained entrance/hover motion with reduced-motion support.

## Shop the Look

- Affiliate: `/s/[slug]/affiliate/look`; Personal: `/s/[slug]/look`; local/shared preview: `/shop/look`.
- Separate Women/Men views cross-fade over 0.35 seconds and use up to four of the latest products assigned to that audience. Numbered pins select the corresponding product cards. No products are invented for an empty collection.
- Two bundled, unbranded SVG editorial outfit illustrations are clearly labeled. They are not photographs of the exact linked products. Sellers can upload licensed outfit photos in Store Manager and publish them with their catalog. Visitors can try a temporary local photo without changing the public storefront.
- Share This Look preserves the selected audience and uses the existing social-share modal. Unpublished local previews require a published or shared link before sharing. The 9:16 story preview exports a 1080 x 1920 PNG locally, with matching numbered products and store attribution. Amazon static prices remain hidden in both lookbook cards and story output. Cross-origin photo failures fall back to a bundled illustration rather than requiring a remote image API.
- Affiliate buttons open external merchants with sponsored/nofollow attributes. Personal buttons open the existing product landing page and its existing checkout. Lookbook metadata uses matching canonical/OpenGraph URLs; suspended stores remain blocked.

## Verification

Final results: `npm run build` passed with zero errors; `npm test` passed all 163 tests (0 failures).

The full automated suite and production build were run on the final working tree. The suite covers localization, LTR/RTL updates, extension locale handling, filtered newest-product selection, URL fallback/private-address rejection, authenticated publishing/draft retention, SEO output, shared lookbook data and separate purchase paths. Database tests use the existing PGlite integration environment; a local Windows OS-account compatibility shim was needed in this restricted runtime and is not included in the patch.

Pixel screenshots could not be completed: installed Chromium exited because its GPU process was unavailable in this environment. Rendered React component tests and interactive React tests passed. No claim of live browser screenshot validation is made.

No environment files, database credentials, API keys, browser profiles, temporary scripts, build output or node_modules are included.
