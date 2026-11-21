# SellPostly Delete Niche Shop Patch

Apply these files at the repository root after SellPostly-Gemini-Full-Endpoint-Fix.zip. Keep all existing source, environment settings and data.

## Required database update

Run npm run db:init using the existing configured database environment before deploying this code. The existing initialization script automatically reads every statement-breakpoint block in src/db/schema.sql; no script change or new package is needed. New idempotent columns: deleted_at and generated is_primary (true exactly when store_mode is general). Existing primary shops, products and financial records remain unchanged by initialization. No live database migration was performed here.

## Behavior

/settings displays Delete Niche Shop only for a saved specialty shop with storeMode niche and isPrimary false. The accessible modal names the shop, explains permanence, and offers Cancel or Yes, Delete Shop in English, French and Arabic, with RTL inherited from the language context. Delete and repeat actions are disabled while pending. Failure stays in the dialog with a localized retry notice.

DELETE /api/shops?id=<shop UUID> requires the existing authenticated seller identity, rejects cross-origin browser requests, and uses parameterized SQL guarded by owner_key, store_mode niche, is_primary false and deleted_at IS NULL. Client-supplied flags cannot make a primary shop deletable. Invalid IDs, primary shops and other owners' shops are rejected.

Deletion clears product arrays from every catalog, unpublishes and retires the niche storefront, removes it from seller lists and sitemap entries, blocks new public orders and catalog saves, and releases its slot in the ten-niche-shop limit. Its slug remains retired. The underlying historical shop record is retained so existing orders, disputes, payouts and accounting foreign keys stay intact; financial records are never cascaded away.

On success, local drafts, matching pending studio/shop imports and the deleted shop's cart cache are cleared, and settings selects the matching primary store with a success notice. Studio no longer merges stale deleted niche drafts back into the target list after a successful server refresh. Old tabs cannot republish the retired niche through normal save or rename routes.

## Verification

npm run build and npm test were run in the staged complete source: 121 tests pass. New integration coverage uses isolated Postgres-compatible databases and initializes the schema twice, verifies primary and ownership protection, removes public catalog content, preserves order records, rejects stale saves, and confirms a freed niche slot can be reused. Additional tests cover local cleanup, primary fallback selection, API authentication/origin rejection and translated dialog text. Browser checks verify hidden primary deletion, cancel without a request, one confirmed deletion, EN/FR/AR labels and RTL, local cleanup and return to primary settings.

No production deployment, actual shop deletion or live database write was performed. The original read-only checkout remains unchanged; this ZIP contains the source changes to apply.
