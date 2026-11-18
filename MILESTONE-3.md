# Milestone 3: store trust and manual administration

## Install and migrate

Copy this source into your SellPostly project while preserving your own git history and private environment files. Run npm ci. Configure DATABASE_URL, PRO_MASTER_KEYS (or GUMROAD_PRODUCT_ID), and a strong server-only ADMIN_SECRET_KEY. Keep the existing public escrow wallet/network configuration.

Before opening /admin or /s/[slug], rerun the protected POST /api/db/init endpoint with x-admin-secret. This applies the idempotent schema changes: shops.verified and shops.suspended default to false, the order insertion trigger blocks suspended shops with a row lock, and payout reservations require an active subscription. Existing shop data, holds, orders and payout history are preserved. No production database was changed during implementation.

Then run npm run build and visit /admin directly. Admin is never added to public navigation or the sitemap and has noindex metadata. Unlock it with ADMIN_SECRET_KEY. The UI keeps the key in sessionStorage for the current tab session; Lock Admin Session clears it and the displayed data. No admin credential is embedded in client bundles.

All new admin APIs require exactly the x-admin-key header. There is no development bypass, Pro-key bypass, cookie fallback, or acceptance of the initializer's x-admin-secret header. Missing configuration rejects access. Keys are compared using constant-time digests, and responses use Cache-Control: no-store.

## Product categories and trust controls

Digital Product, Art and Sport are available alongside existing categories in the seller category suggestions and storefront filter tabs, with English, French and Arabic labels. Canonical category values remain English for compatibility with saved shops.

Store verification and suspension are separate, admin-controlled database flags. Seller catalog uploads, localStorage values and old compressed buyer links cannot create a verification badge or change suspension. A verified published storefront shows a checkmark and Verified Store in its header. A suspended published storefront renders only a localized policy-review notice with its language selector; catalog content and checkout are not sent to that visitor.

Suspension prevents new orders both in the order API and in the PostgreSQL insertion trigger. Existing order reviews, disputes and accounting records remain available. Revoking a Pro license is a separate control: suspend its shop as well if new buyer orders must stop.

## Admin APIs

Every endpoint below requires x-admin-key. The record endpoints support GET, POST and PATCH; POST and PATCH apply the same validated operation.

GET /api/admin/overview returns:
- balances: separate string-valued metrics for every coin/network
- active_subscriptions: exact count as a string
- orders, payout requests and store summaries needed for review

Metrics are accounting records, not wallet balances:
- total_gmv: gross held/released/disputed payments, excluding unverified pending, cancelled and refunded orders
- total_commission_5pct: generated 5% commission on those same orders
- active_escrow_held: gross funds in held or disputed orders (including the commission portion)
- pending_payouts: pending and approved requests
- paid_payouts: requests marked paid
- active_subscriptions: database subscriptions with active status

Coin/network buckets are never combined into a misleading fiat grand total. Monetary values remain PostgreSQL decimals serialized as strings.

GET /api/admin/orders/[id] returns an order for review.
POST or PATCH /api/admin/orders/[id] accepts action and optional note:
- verify: pending to held, sets payment_verified_at to now; the existing trigger calculates release from the snapshotted hold
- release: held or disputed to released, only after the original hold deadline
- refund: held or disputed to refunded
- cancel: pending to cancelled

Verification requires a structurally valid stored transaction hash. The admin must independently check the receiving address, token, network, amount, confirmations and transaction before verifying. The server does not contact a blockchain provider or attest that funds arrived. Release never shortens the original hold. Refunding and marking paid only record external decisions; they never initiate transfers. Terminal states cannot be replayed into active states. Order changes append a timestamped action/note to details.admin_actions.

GET /api/admin/payouts/[id] returns a request for review.
POST or PATCH accepts:
- action approve: pending to approved
- action paid: approved to paid, with optional tx_id matching the network's hash format
- action reject: pending or approved to rejected

Approve before marking paid. Paid requests cannot be rejected or changed back to pending, preventing their previously spent reservation from becoming available again. Rejecting an unpaid request releases its reservation through the existing balance calculation. Missing optional TxID preserves an existing reference. The $10 minimum and released-balance lock remain in request_seller_payout; admin APIs cannot create smaller requests or alter their amounts/destination.

GET /api/admin/shops/[id] returns trust flags.
POST or PATCH accepts verified and/or suspended, each a real boolean. Omitted fields are preserved. Republishing a seller catalog cannot reset either flag.

GET /api/admin/subscriptions lists known license fingerprints, provider, state and verification dates.
POST or PATCH accepts owner_key (the 64-character fingerprint) and action activate or revoke. Raw Pro license keys are not stored or displayed here.

Pro requests continue to verify the supplied master/Gumroad key, then enforce the database status when DATABASE_URL is configured. External verification or republishing no longer reactivates a revoked or expired subscription. New externally valid licenses are registered active on first verified use. Activating a database row cannot make an invalid or refunded Gumroad license valid. A configured database failure denies Pro authentication; complete the schema migration before use. Protected fulfillment and payout paths also enforce active subscription state.

## Admin interface

The control center contains six KPI cards and four sections:
- Escrow Orders & Disputes: inspect payment evidence, buyer/item details, disputes, and record decisions
- Seller Redeems ($10+): approve, reject, or record a completed external payout and optional TxID
- Stores (Verify / Suspend): set independent trust and suspension flags
- Pro Subscriptions: review fingerprints and activate/revoke access

All new labels, notices, controls, statuses and action feedback are translated into EN, FR and AR using the existing language context and Arabic RTL. The interface uses SellPostly's slate, white and emerald styling. Session data is cleared on lock. Use the admin account only in a trusted browser session.

## Operational limits

This is a manual accounting and review center. There are no wallet private keys, seed phrases, transaction signing implementations, automated refunds, automatic releases or server-initiated payout transfers. The public escrow address and buyer/seller transaction references are not private signing keys. Keep all external custody and transfer operations outside this server.

Testing uses an isolated embedded PostgreSQL engine, not a live Neon connection. The test suite covers authorization, migrations, trust-source isolation, suspended order insertion, escrow maturity and terminal states, payout transitions/reservations, exact metric values, and revocation that persists after external license verification. Production smoke checks cover admin login output and rejection of unauthorized admin APIs. Real database/provider integration must still be checked after configuring your deployment.

In this restricted Windows execution environment, tests needed a temporary os.userInfo fallback for tsx. That environment-only shim is not shipped. The normal developer command remains npm test.

