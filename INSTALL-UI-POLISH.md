# Clickable controls and niche-to-main-store links

Merge these files into the existing SellPostly project after the Multi-Shop source patch. This is a focused source patch, not a standalone repository.

Run npm run build and npm test after merging. No new dependencies, environment variables or database migration are needed for this polish patch. The earlier Multi-Shop database migration must already be installed. No live database or production deployment was modified while preparing these files.

## Interaction states

Shared CSS gives enabled buttons, links, selectors, switches and card actions a pointer cursor, hover highlight/elevation, keyboard focus ring, selected-state outline and subtle press feedback. Disabled controls remain noninteractive and use the disabled cursor. Reduced-motion users get no scale or transition animation. Navigation marks the current page, Builder/Preview buttons mark the selected view, and storefront Add to Cart buttons immediately show a translated checkmark confirmation.

## Niche-to-main-store link

A public Personal niche links only to /s/[primary-slug]/personal; an Affiliate niche links only to /s/[primary-slug]/affiliate. The server finds the same seller's matching primary record and requires it to be published and not suspended. A client-supplied slug cannot override this public lookup. When no eligible primary store exists, the link is omitted. Primary stores never display this niche-only card.

In the niche Builder, Show link to my main store defaults on. Toggle it and click Save Store Settings to publish the setting without scrolling, navigation or opening a share dialog. A success checkmark and status confirm the save. The preference is stored in the shop catalog JSON, existing local drafts and compressed snapshots. Share Store also publishes the current catalog as before.

EN, FR and AR strings are included; the arrow mirrors for Arabic RTL. Existing themes, payment flows, image heights and Affiliate safeguards remain intact.
