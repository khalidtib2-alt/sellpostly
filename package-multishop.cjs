const fs=require('fs'),path=require('path');const target=path.join(process.env.TEMP,'SellPostly-Multi-Shop-Source-Patch');fs.mkdirSync(target,{recursive:true});
const files=['src/db/schema.sql','scripts/init-db.mjs','src/lib/db.ts','src/lib/pro-auth.ts','src/lib/shop-auth.ts','src/lib/multi-shop-service.ts','src/lib/free-shop-service.ts','src/lib/order-service.ts','src/lib/admin-service.ts','src/lib/save-payment-settings.ts','src/lib/shop-handoff.ts','src/app/api/shops/route.ts','src/app/api/shop/route.ts','src/app/api/shop/account/route.ts','src/app/api/seller/dashboard/route.ts','src/app/dashboard/seller-dashboard.tsx','src/app/shop/shop-data.ts','src/app/shop/catalog-modes.ts','src/app/shop/multi-shop-data.ts','src/app/shop/multi-shop-switcher.tsx','src/app/shop/shop-builder.tsx','src/app/shop/pro-gate.tsx','src/app/shop/storefront-templates.tsx','src/app/shop/use-shop-cart.ts','src/app/shop/product-landing.tsx','src/app/translations.ts','src/app/user-guide-data.json','tests/multi-shop.test.ts','tests/storefront-templates.test.ts','tests/affiliate-guardrails.test.ts'];
for(const file of files){const out=path.join(target,file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(file,out);}
fs.cpSync('chrome-extension',path.join(target,'chrome-extension'),{recursive:true});
fs.writeFileSync(path.join(target,'INSTALL-MULTI-SHOP.md'),`# SellPostly multi-shop source patch

Apply after the Checkout Amount / Admin Wallet patch and the earlier Media Tools, Peer Payments and Guide SEO patches. This is a focused source patch for the existing SellPostly application, not a standalone repository. No package dependencies change.

1. Back up the existing source and database, then merge these files into the project root.
2. Run npm run db:init using your existing server-side Neon credentials before deploying this code. This applies the idempotent migration in src/db/schema.sql. No production database was modified while preparing this patch.
3. Run npm run build and npm test in your normal development environment, then deploy using your existing workflow.
4. In chrome://extensions, reload the included chrome-extension folder (version 1.0.6). Sign in to My Shop on the website, click Sync My Shops in the popup, and select the exact destination.

## Backward-compatible storage

The existing shops record, UUID, slug, orders, primary catalogs, disclosure, payment settings and admin hold remain in place. That general record continues to serve its separate /s/[slug]/personal and /s/[slug]/affiliate URLs. No products are moved between those catalogs. Niche shops use separate rows and globally unique permanent slugs with one catalog type each. The opposite public route returns not found. Admin trust/hold settings are independent per niche record.

Migration adds shops.store_mode, shops.shop_type and shops.niche_name, replaces the single-owner constraint with a partial unique index for the legacy general record, and installs a row-locking plan-limit trigger. Free accounts have one primary general record representing one Personal Store and one Affiliate Deals Shop. Verified Pro accounts may add up to ten niche records across both types. Existing subscriptions remain Pro; niche creation never trusts a client-supplied plan.

## Free accounts and Pro upgrades

Start Free Primary Stores creates a random browser-held account credential, stored in localStorage; keep browser data for account access. It is sent in x-shop-key and hashed on the server. A Pro license still uses x-pro-key. If the same browser activates Pro before that Pro account has published separate shops, authenticated possession of both credentials links the license to the existing free account through shop_account_links. Existing shop IDs and URLs stay unchanged. Independent populated accounts are not automatically merged. Pro license verification, expiration and revocation still apply; public buyers never need credentials.

## Independent editing and imports

Use Active Shop to switch editors without moving products. Each niche has its own draft, branding, catalog and either personal payment settings or affiliate disclosure. Create Niche Shop accepts Personal/Affiliate type, name, custom lowercase URL slug, niche name and bio. The permanent slug is chosen at creation. Save Payment Settings stays in place. Share Store publishes the selected shop and opens the translated sharing modal.

Niche storefronts display the niche badge and curated hero, hide broad category tabs and present the full collection. Search and audience filters remain available. Importing into a niche assigns its niche category automatically. Missing or stale exact-shop destinations fail instead of silently importing into another shop; sync again after switching accounts.

Extension sync fetches the authenticated shop list inside the seller's frontend tab, returns only destination metadata, and never copies Pro/account credentials into extension storage. Cached lists are scoped to the frontend origin. The existing frontend allowlist and canonical URL fallback remain unchanged. Affiliate tracking links, Amazon-only Affiliate image/price safeguards, and unrestricted Personal images/prices are preserved.

Seller dashboard balances and payouts are scoped to the selected shop. Preview and public carts are separated by shop; Personal product previews return to their active niche shop. Existing primary and snapshot cart keys remain supported.

EN, FR and AR labels and guides are included; Arabic uses existing RTL support. No private keys, secrets, node_modules, build outputs or test-environment shim are included.
`);
console.log('Prepared '+files.length+' source/test files plus complete extension and installation notes.');
