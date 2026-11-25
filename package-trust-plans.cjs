const fs=require('fs'),path=require('path');const dest=path.join(process.env.TEMP,'SellPostly-Trust-Policies-Admin-Plans-Patch');fs.mkdirSync(dest,{recursive:true});const files=['src/app/shop/store-policy-data.ts','src/app/shop/store-policy.tsx','src/app/shop/buyer-safety.tsx','src/app/shop/shop-data.ts','src/app/shop/shop-builder.tsx','src/app/shop/peer-checkout.tsx','src/app/shop/crypto-checkout.tsx','src/app/shop/cod-checkout.tsx','src/app/shop/product-landing.tsx','src/app/shop/pro-gate.tsx','src/app/dashboard/seller-dashboard.tsx','src/app/dashboard/notification-settings.tsx','src/app/admin/admin-dashboard.tsx','src/app/admin/seller-plan-manager.tsx','src/app/api/admin/seller-plans/route.ts','src/lib/db.ts','src/lib/free-shop-service.ts','src/lib/multi-shop-service.ts','src/lib/order-service.ts','src/lib/peer-order-service.ts','src/lib/cod-service.ts','src/lib/public-storefront.ts','src/lib/pro-auth.ts','src/lib/shop-auth.ts','src/lib/subscription-access.ts','src/lib/seller-plan.ts','src/lib/seller-plan-admin.ts','src/lib/save-payment-settings.ts','src/lib/shop-handoff.ts','src/db/schema.sql','scripts/init-db.mjs','src/app/translations.ts'];for(const file of files){const out=path.join(dest,file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(file,out);}fs.mkdirSync(path.join(dest,'tests'),{recursive:true});for(const file of fs.readdirSync('tests').filter(file=>file.endsWith('.test.ts')))fs.copyFileSync(path.join('tests',file),path.join(dest,'tests',file));
fs.writeFileSync(path.join(dest,'INSTALL-TRUST-PLANS.md'),`# Store policies, buyer safety and Admin seller plans

Apply after the TRON / Digital Payments patch and all preceding Multi-Shop, UX and Pricing patches. This is a focused source patch for the existing repository, not a standalone project. Existing regression fixtures now explicitly configure valid seller policies; the full test suite is included.

1. Back up the source and database, then merge these files into the project root.
2. Run npm run db:init BEFORE deploying the new code. This adds subscriptions.plan_override and plan_changed_at plus the seller_effective_plan function and updated niche-limit enforcement. The init script verifies the new columns. Existing providers, license fingerprints, catalogs, payments and orders are preserved.
3. Run npm run build and npm test, then deploy using your normal process. No new npm dependencies or environment variables are required. The live database and production deployment were not changed while preparing this patch.

## Required Personal Store policy

In /shop Builder, choose No Refunds / Final Sale, 7-Day Exchange/Return or 14-Day Return Policy, then enter a short delivery timeframe (physical dispatch or digital delivery). Save Payment Settings persists this in place. The public Personal Store and its checkout display the exact selected preset and seller note. No policy is invented for legacy stores: missing values show a clear notice, and server-side order creation is blocked until the seller supplies them. Required consumer rights are not waived by a seller preset.

The policy is stored independently in each Personal catalog and survives local drafts and snapshots. Affiliate stores continue using partner checkout and are not required to choose a Personal refund policy.

## Buyer reminders

Direct, COD and USDC escrow checkout display a concise checklist: verify payment details in the storefront, distrust replacement details in private messages, never share passwords/OTPs/seed phrases/private keys, and consider available USDC escrow for high-value orders. Existing SaaS neutrality notices and USDC-only escrow rules are preserved.

## Admin Seller Plan Manager

Open /admin > Pro Subscriptions > Seller Plan Manager. Search by seller/account email, store name or account ID. Select Free or Pro; the authenticated request persists the override immediately and confirms the save. The route is /api/admin/seller-plans (GET search, POST update), protected by the existing strict x-admin-key check against ADMIN_SECRET_KEY.

Free retains one general record representing its two primary storefront types. Pro permits up to ten niche records across Personal/Affiliate. Plan overrides are separate from license provider/expiry records and are not overwritten by later license verification. Linked license/free accounts are managed as one canonical seller account. An Admin plan change activates that account; separate revoked license credentials and suspended storefront controls still apply.

Downgrading does not delete products or orders. Niche public pages and new niche publishing/orders become unavailable until Pro is restored; primary pages remain available. Existing buyer order-status/dispute records remain intact and Admin can review existing orders. Niche editing/publishing and Pro dashboard APIs require an effective Pro plan. The shop refreshes its tier on focus; no secret credentials are returned in public storefront data.

A browser-held Free account that receives an Admin Pro grant can use its existing account credential for Pro shop/dashboard requests without issuing a replacement license. A license holder downgraded to Free retains primary-shop access with their existing valid credential. Automatic billing expiry and explicit Admin overrides are handled separately; no new subscription charge or payment transfer is performed by changing a plan.

EN, FR and AR strings and existing RTL/theme support are preserved. No secrets, build outputs, browser reports or test-environment shims are included.
`);console.log('Prepared '+files.length+' source files, complete tests and instructions.');
