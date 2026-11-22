# SellPostly — Reference Prices & Live Affiliate Deals

Back up your repository, then extract this patch at its root, replacing matching
files. Apply over the existing SellPostly source and earlier patches.
Run npm run build and npm test. No new dependency or database migration is needed;
the existing JSON shop catalogs preserve the new optional dealTag field.

## Cards
- Displays the saved reference price and optional muted strikethrough original.
- A numeric original price inherits the main price currency when identifiable:
  85 MAD + original 145 displays 85 MAD and 145 MAD.
- Affiliate cards display a compact Check Live Price pill beside the price.
  EN: Check Live Price; FR: Voir le prix actuel; AR: تحقق من السعر الحالي.
- The pill opens the existing merchant URL in a new tab, preserving affiliate
  parameters and sponsored/noopener attributes.
- An optional seller-entered deal/rating tag appears below the price, e.g.
  Flash Deal • 4.6★ or 9.4K+ Sold. It is bounded to 80 characters and rendered as text.
- Shared previews, public cards and Store Manager cards use the same price component.
- Amazon Affiliate restrictions still hide static prices, discounts and custom deal
  tags; the live-price link remains available. Personal Store prices stay visible.
- Compact card framing, original affiliate CTAs, sharing and checkout remain.

## Store Manager
Original Price (Optional) reuses the existing compareAtPrice field. There is no
duplicate original-price field. The new Deal / Rating Badge (Optional) text input
is placed alongside Price and Original Price. Existing preset Hot/Sale/New badges
remain separate and functional. Editing, local catalogs, shared links and imports
preserve the fields. Older items need no conversion.

## Price accuracy
Saved prices, original prices, tags and ratings are seller-maintained references.
This patch does not scrape or claim to synchronize live merchant prices or timers.
The live-price pill directs buyers to confirm the current merchant offer even
after a flash deal expires. Its translated helper explains that offers can change.

## Verification
npm run build: passed, zero errors.
npm test: 147 passed, zero failures.
Tests cover field persistence in local/shared/imported catalogs, original price
currency display, merchant links, Amazon restrictions, and exact FR/AR labels.
Browser checks confirm the reference/original prices, tag, affiliate URL and live
price label in EN/FR/AR, including Arabic RTL.
The existing non-fatal /api/import runtime re-export warning remains.
No live store scraping or external transaction was needed for verification.
