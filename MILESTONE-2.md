# Milestone 2 setup and API contracts

## Install and migrate

1. Copy this source over the SellPostly project while preserving your own .env.local and git history.
2. Run npm ci and set the server-only DATABASE_URL, PRO_MASTER_KEYS (or optional GUMROAD_PRODUCT_ID), and ADMIN_SECRET_KEY from the Milestone 1 setup.
3. Set NEXT_PUBLIC_ESCROW_WALLET and NEXT_PUBLIC_ESCROW_NETWORK before building. These must be the same destination/network buyers see.
4. Run the existing protected POST /api/db/init with the x-admin-secret header to apply the idempotent schema. This milestone adds a normalized transaction index so EVM hash capitalization cannot bypass uniqueness. If legacy duplicate hashes exist, reconcile them before retrying migration.
5. Run npm run build. Open /dashboard and activate the Pro license. The same license owns the shop published at /shop.

The ZIP has source, tests, extension files and configuration templates, without node_modules, .next, private environment files, or git history.

## Buyer checkout

Only published personal seller stores at /s/[slug] submit live orders. Existing compressed snapshot links and builder previews do not create database orders. Cart checkout passes actual product IDs and quantities, including multiple products.

POST /api/orders accepts:
- slug: published shop slug
- coin: USDC or USDT
- network: the platform's configured escrow network
- tx_id: complete transaction hash (EVM: 0x plus 64 hex characters; Solana: Base58)
- items: array of objects containing id and integer quantity (1–99; up to 50 lines)
- buyer: object with name and contact (email or international phone)
- delivery_note: optional text

The server reads prices from the published catalog and computes exact six-decimal totals with BigInt. Buyer-provided totals, status, commission, wallet and hold settings are ignored. The insertion rechecks the catalog to avoid accepting a stale price. The database snapshots the shop hold period and enforces unique transactions. The response includes the new order ID, exact amount, coin/network, hold duration and pending status.

No transfer is considered verified merely because a TxID was submitted. There is no on-chain verification, automatic release or transfer execution in this milestone. Pending orders must be independently verified by a trusted backend/admin workflow before moving to held; there is deliberately no buyer or seller endpoint that can make that transition.

## Buyer status, delivery and disputes

POST /api/orders/[id]/dispute accepts contact plus action:
- status: fetch safe order fields and saved delivery instructions
- dispute: provide reason; atomically changes a held order to disputed
- confirm_receipt: records buyer_confirmed_at on a held order without shortening its hold or changing its status

The default action is dispute. The contact must match the normalized contact stored for the order. Email matching is case-insensitive; phone punctuation is ignored. An incorrect contact, unavailable transition, or unknown ID gives the same generic response. Buyers must keep their random order UUID private. This is contact-match access, not email/SMS ownership verification. Delivery notes and digital keys are returned only to the matching buyer or the authenticated owner. Use a stronger verified buyer identity before handling high-value secrets.

The checkout includes submit, status lookup, confirm receipt, and dispute controls. Keep the ID after submitting; a duplicate transaction returns a conflict and does not expose another order's ID.

## Seller APIs

All seller endpoints require x-pro-key and derive owner_key only through the existing server-side license verifier. A supplied owner key is never trusted.

GET /api/seller/dashboard:
- shop: owned published shop identity, or null
- balances: separate exact string amounts per coin/network
- orders: full owned order list, with buyer, item, dispute and fulfillment details
- payouts: full owned payout request history

The five metrics are:
- gross_sales: gross amounts of held, released and disputed (verified) orders
- total_commission: computed commission of those same orders
- pending_escrow: seller net amounts of held and disputed orders
- available_balance: eligible released seller net, minus pending/approved/paid payout requests
- total_redeemed: paid payout requests

Pending unverified orders, cancelled orders and refunded orders are excluded from financial sales totals. The response is generated from one SQL statement for a consistent snapshot. Coins and networks are never added together or converted into a misleading dollar grand total. Decimal values remain strings throughout the API and display.

POST /api/seller/orders/[id]/fulfill accepts tracking and/or delivery_notes. Updates are restricted to the owning shop's held/released orders. The update changes only the fulfillment section of details; buyer, items, disputes and verification data are preserved. Digital key instructions are visible to the matched buyer through status lookup.

POST /api/seller/payouts accepts amount (decimal string), coin, network and wallet. The amount must be at least 10.00 and the destination must match the selected address format. This endpoint only calls request_seller_payout: its shop lock, ownership check and released-balance reservation prevent double redemption. An approval, rejection or actual transfer still requires a separate trusted workflow. Neither API nor dashboard sends funds.

## Verification

The production build passed with zero errors. Seven isolated tests cover license checks, idempotent PostgreSQL schema, commission/hold rules, exact decimals, canonical catalog pricing, duplicate transactions, buyer-contact matching, owner isolation, delivery notes, disputes, confirmation without early release, and payout reservations per coin/network.

Production smoke checks cover /, /shop, /dashboard and unauthorized seller endpoints. PostgreSQL tests run with PGlite and injected queries; a real Neon database and real license/provider integration must be configured and verified in the deployment. No live database was changed during implementation.

In this restricted Windows execution environment, tsx needed a temporary os.userInfo fallback to run tests. That environment-only shim is not part of the shipped application. npm test remains the normal command on an unrestricted developer machine.

