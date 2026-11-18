# sellpostly
## Milestone 1 — Free formatter and Pro storefront

Use Node.js 20 or later. Run `npm ci`, copy `.env.example` to `.env.local`, set the appropriate values, and run `npm run dev`. Run `npm test` and `npm run build` before deployment.

### Configuration

- `DATABASE_URL`: Neon PostgreSQL connection string (server only).
- `PRO_MASTER_KEYS`: comma-separated or newline-separated license keys (server only). Each license owns one published shop. Rotate deliberately: changing a key changes its owner fingerprint.
- `GUMROAD_PRODUCT_ID`: optional Gumroad product whose licenses are accepted. Verification does not increment license uses and rejects refunded, disputed, cancelled, ended, or failed subscriptions. Keys are not stored in the database; only a SHA-256 owner fingerprint is stored.
- `ADMIN_SECRET_KEY`: required in production for schema initialization. Send it as `x-admin-secret` to `POST /api/db/init`. Initialization is atomic and idempotent. With no secret, initialization is allowed only outside production. Do not expose this value with a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_ESCROW_WALLET`: the public receiving address controlled by the platform. No private key belongs in this project.
- `NEXT_PUBLIC_ESCROW_NETWORK`: `Polygon` (default), `Base`, `Arbitrum`, `BNB Smart Chain`, or `Solana`. Confirm the wallet/network/token combination before enabling checkout. Public values are embedded at build time; rebuild after changing them.

Outside production, and only when `PRO_MASTER_KEYS` is empty, the development key is `SELLPOSTLY-PRO-DEV`. This key never activates a production build. Master keys represent administrator-managed licenses; billing is not implemented for them. Gumroad keys are reverified when opening the builder and publishing. License keys are saved on the user's device and sent in `x-pro-key`; protected APIs perform their own server verification.

### Store publishing

The free homepage contains only social tools, with no wallet or shop form. `/shop` shows the Pro preview and activation dialog to unlicensed visitors. A verified key unlocks the local builder. Store logo, theme, catalog, and 3–15 day hold (default 7) are persisted locally. **Copy Shareable Shop Link** publishes the current catalog to Neon and copies a stable `/s/[slug]` URL. Publish again after edits. Buyers never need a license. Existing `/shop?s=...` snapshot links remain buyer-only and do not overwrite the local seller catalog.

The extension retains product import, full studio, formatting, copy, and platform sending. Shop buttons and their handlers were removed. The uploaded extension had no background worker; none was added because no background work is required.

### Escrow foundation and operational limits

This milestone provides receiving-wallet checkout instructions, QR codes, hold configuration, and the database foundation. Missing or invalid platform wallet configuration disables address/QR payment actions and shows a localized setup notice. A seller-provided legacy wallet is never used as the buyer's payment destination. The selected platform network is authoritative. The configured hold is displayed alongside the escrow badge, with an explicit notice that automatic release is not enabled.

**This is not a deployed escrow smart contract or an automatic payment processor.** No transfer is considered verified because a buyer typed a TxID, and no balance is credited from a receipt. On-chain verification, dispute handling, actual release, payouts, and order-to-wallet reconciliation require a subsequent milestone. Until those are in place, use checkout only in controlled testing. Configuring an address alone does not enforce a hold on-chain.

`orders` computes commission and seller net values with PostgreSQL decimal arithmetic (5%, six decimal places). The database snapshots the shop's hold on order creation, prevents edits to verified payment values, and blocks release before the hold ends. `payout_requests` enforces a $10 minimum. The payout helper locks the shop, verifies ownership, and reserves only released balances in the same coin/network, subtracting pending/approved/paid payouts. Application code must use this helper rather than inserting payouts directly. There is intentionally no public payment-verification or payout endpoint in this milestone. The database credential must be server-only and limited to trusted backend code.

Tests use an isolated embedded PostgreSQL engine and mocked Gumroad responses. A real Neon connection and live Gumroad purchase are needed for deployment integration tests; schema initialization is not executed against a live database during a build.

## Milestone 2

Buyer order submission, contact-matched disputes/receipt confirmation, seller order management, and the Pro dashboard are now implemented. See MILESTONE-2.md for migration steps, API contracts, exact balance definitions, and operational limits. Re-run the protected database initializer before use. Automatic payment verification, releases and actual payouts remain disabled.
