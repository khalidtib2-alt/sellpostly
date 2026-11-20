# Checkout amount and locked admin wallet patch

Merge these files into the existing SellPostly project after the Payment Save / Uniform Cards / Guide SEO patch. This is a focused source patch, not a standalone application.

Set NEXT_PUBLIC_ADMIN_ESCROW_USDC_WALLET to the platform's Polygon USDC receiving address, then rebuild/redeploy. It takes precedence over the existing NEXT_PUBLIC_ESCROW_WALLET platform configuration, which remains supported for existing installations. Never set either variable to a seller wallet. Public wallet addresses are not private signing keys.

Missing or invalid platform configuration disables escrow transfers and submission. An invalid nonempty admin address does not fall back to another wallet. Seller wallet settings remain available only for direct USDC checkout. Both required and buyer-enabled escrow use the same locked platform address and Polygon network.

Money is displayed with two decimals using exact integer rounding. Accounting totals, copied payment amounts and API values keep their original precision; no database amounts or schema are changed.

No new dependencies or migration. Run npm run build and npm test after merging.
