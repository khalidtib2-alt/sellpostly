# SellPostly Unified Seller Workspace

Apply the included files to the repository root after SellPostly-Gemini-Creator-Tools-Patch.zip. This is a focused source patch, not a full repository. Existing data and environment files must be kept. No database migration, npm dependency or credential changes are needed.

## Three work areas

/settings: same authenticated seller account and shop storage, store identity/bio/logo/custom slug, refund and delivery policies, affiliate disclosures, theme settings, seller email and payout wallet, eight direct payment methods including TRON, USDC-only escrow, plan status/upgrade. Payment saving remains in place. Changing a primary store slug changes the shared primary URL for both catalog types; niche shops retain separate slugs. Renames are validated and restricted to rows owned by the authenticated seller.

/shop: multi-shop switcher, products and public template previews. Settings are linked, not displayed in the product workspace. Existing catalog separation, policies, payouts and Pro limits remain server-enforced.

/studio: imported or entered product details, editable descriptions/highlights/captions, video scripts, unbranded photo generation, four-corner cropping, resize/format/export, brightness/contrast, optional Promo Image Studio overlays, video cover capture and storefront QR tools. Select a primary or niche shop before publishing. The handoff preserves the product identity and updates an existing product without duplicating it, preserves its digital delivery configuration, and keeps the clean product photo in the catalog. Large homepage photos are compressed for the handoff. /tools redirects to /studio.

Chrome Extension 1.0.7: load chrome-extension/ using Chrome's Load unpacked after replacing the old extension folder. Open in Studio First uses a short /studio URL and a same-origin localStorage/postMessage bridge. Direct Send to My Shop remains available. Amazon affiliate tags remain intact; Amazon CDN images remain blocked only for Amazon affiliate imports, with Personal imports unchanged. The frontend detection/fallback remains https://sellpostly.vercel.app and continues to exclude vercel.com.

## Gemini configuration and diagnostics

Set GEMINI_API_KEY only on the server. Every nonempty key is trimmed and sent in the official x-goog-api-key header, with no AIza prefix restriction; AQ. keys are not filtered out. Google must still accept the credential, billing state and model access.

The fixed endpoint is https://generativelanguage.googleapis.com/v1beta/models/ . Copy uses gemini-2.5-flash and localized local templates on failure. Images try gemini-2.5-flash-image:generateContent with TEXT/IMAGE response modalities, then gemini-2.0-flash-exp-image-generation, then imagen-3.0-generate-002:predict only on model-unavailable errors. A shared timeout bounds the chain. Quota, billing or authentication failures do not cause additional billable retries. Responses expose only safe diagnostic codes/status and translated fixed explanations; never raw Google error strings, credentials or request contents.

Google currently documents Imagen as retired, and legacy model access varies. The requested legacy fallbacks are implemented but are not guaranteed to be available. Official references: https://ai.google.dev/gemini-api/docs/image-generation and https://ai.google.dev/gemini-api/docs/imagen .

All image generation remains text-only using controlled generic visual attributes. No source photographs go to Google. Generated images are labeled representative and require review for unwanted branding/text before use. Automated safeguards do not guarantee legal or affiliate-program compliance.

## Verification

npm run build and npm test were run on the staged complete source; 114 tests pass. Coverage includes AQ./legacy header handling, model fallback request shapes, sanitized quota/billing/auth diagnostics, four-corner aspect/bounds behavior, owner-scoped slug changes, target shop publishing and idempotent existing-product updates, preserved digital settings, and Amazon image restrictions. Existing extension tests now assert version 1.0.7 and the Studio bridge alongside direct import.

Browser checks with synthetic API data verified product/settings separation, eight payment switches, payment saving without navigation, /tools redirect, same-origin studio import, publishing to a selected niche shop with copy/photo, and EN/FR/AR plus RTL. Real Google paid calls, live database writes, Chrome-store publishing and production deployment were not performed. The original read-only checkout is unchanged; apply this patch before deploying.
