SellPostly Product Landing and Social Sharing Update

1. Stop your local development server and back up the repository.
2. Extract this ZIP into the existing sellpostly repository root, replacing included source files.
3. From that root, run: powershell -NoProfile -File .\Apply-SellPostly-Cleanup.ps1
4. Run: npm test
5. Run: npm run build

Step 3 is required. It removes the retired feature routes, components, assets and obsolete tests listed in REMOVED-FILES.json and clears generated Next.js cache. The script validates package.json and all deletion paths, refuses symbolic-link paths and does not touch environment files or database records.

This source patch replaces the retired feature with reusable, officially colored social share bars on the homepage, public storefronts and product pages. The homepage shares its first generated post when available; otherwise it shares the site link. Instagram and TikTok copy for manual pasting rather than claiming an unsupported web-post action. Full copied captions are retained even when WhatsApp share URLs are capped.

Product pages now include a larger zoomable hero, logo header, accurate reference-price savings, product highlights, enabled payment badges, demo access, a full-width primary CTA, sharing, and related products. Personal cart and checkout behavior remains separate from Affiliate merchant-only checkout. Amazon Affiliate static prices, discount badges and savings remain hidden. Public Affiliate detail URLs use ?type=affiliate; existing Personal routes stay valid. Local preview still requires the seller's saved catalog; publishing creates a public share URL.

The larger homepage preview typography and dark, unclipped logo editor are retained. New copy supports EN/FR/ES/AR. No new packages or schema migration are required. No secrets, dependencies or generated build output are included. No production deployment or database mutation was performed.
