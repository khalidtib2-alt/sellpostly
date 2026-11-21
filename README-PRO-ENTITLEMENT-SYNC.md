# SellPostly Pro Entitlement Sync

Apply the included files at the repository root after SellPostly-Delete-Niche-Shop-Patch.zip. Keep your existing environment configuration, data and source. No new npm dependency is required.

## Database migration required before deploying

Run npm run db:init with the existing configured database environment. The idempotent schema adds subscriptions.plan, plan_source and plan_expires_at and updates seller_effective_plan. This checkout stores seller accounts in subscriptions, not a sellers table. Existing plan_override grants, account links, primary shop IDs, products and orders are preserved. No production database was changed here.

## Resolution and sync

resolveSellerPlan is the single request-level resolver for shopIdentity and proIdentity, used by both /api/shop and /api/shops, /api/pro/verify and authenticated seller workflows. It accepts trimmed x-pro-key and x-shop-key headers, or matching sellpostly-pro-key / sellpostly-free-shop-key cookies. The key verifier retains existing master, Gumroad, development and database-issued crypto-license verification.

An active account with database Pro access can use Pro without supplying a license key. A valid Pro key upgrades the existing Free account to Pro, persists the plan, and binds the license to the same owner so subsequent requests and PostgreSQL niche-shop checks agree. Revoked accounts/keys and expired license-derived access remain restricted; automatic grants retain their source and expiration. Admin plan changes update both the stored plan and override consistently and clear automatic-source metadata. A currently valid key can restore Pro after an admin Free plan change, as requested by the OR rule; revoke the source license/account when access must be blocked.

License/account conflicts fail explicitly rather than silently moving shops or granting access to another account. Existing primary shop IDs, catalogs and financial history remain unchanged. Activation and issued-key activation now forward the Free account token alongside the new key; all existing shop/product mutations read both current credentials via shopHeaders.

There are no separate /api/products, /api/settings or /api/studio routes in this checkout. Product edits, /settings saves and /studio publishing already use /api/shops, so they inherit the same resolver. No unrelated CRUD endpoints were introduced. Future routes should use resolveSellerPlan as well.

## Diagnostics

POST /api/shops returns AUTH_REQUIRED (401), PRO_PLAN_REQUIRED (403), SLUG_UNAVAILABLE (409), NICHE_LIMIT_REACHED (409), LICENSE_ACCOUNT_CONFLICT (409), INVALID_NICHE_SHOP (400), or DATABASE_SCHEMA_REQUIRED (503) for the corresponding failures. The niche modal translates the relevant explanations into EN/FR/AR. Raw database text and credentials are not returned or logged. Cookie-capable mutation/verification endpoints reject cross-origin browser requests. Existing limit and primary-deletion safeguards remain in force.

## Verification

npm run build and npm test were run in the complete staged source: 125 tests pass. Isolated Postgres integration tests cover Free account activation using a real synthetic PRO_MASTER_KEYS verification, immediate creation through the production POST handler, persisted keyless Pro access, unchanged primary IDs, slug collisions, database-only Pro, cookie credentials, Gumroad identity sync, revocation/expiry and account ownership conflicts. Existing admin plan and storefront tests remain passing.

Browser checks with synthetic API responses verify that activation and niche creation forward both credentials, a slug collision stays actionable, a corrected submission creates the shop immediately, and EN/FR/AR with RTL remains functional. No live Gumroad request, license issuance, production deployment, real shop creation or database write was performed. The original read-only checkout remains unchanged; apply the patch and database migration before deploying.
