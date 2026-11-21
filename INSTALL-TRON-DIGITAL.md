# Vertical payment setup, TRON USDT and digital delivery

Apply after the Pricing Page patch and the preceding Multi-Shop / UX polish patches. This is a focused source patch for the existing repository, not a standalone application.

1. Back up source and database, then merge these files into the project root.
2. Run npm run db:init before deployment. The existing init script executes the updated idempotent schema. It expands the allowed direct payment methods/networks for TRON and installs direct-only and duplicate-TxID constraints. No live database was changed while preparing this patch.
3. Run npm run build and npm test in your normal environment, then deploy using your existing process. No new npm dependencies or environment variables are required.

## Seller setup

The eight payment methods now appear in one vertical list with accessible toggle switches, aligned fields, USDC-only governance and one Save Payment Settings action. Saving stays in place. The separate payout-wallet/email settings remain available; duplicate COD/USDC toggles were removed. Primary and niche Personal Stores retain independent payment settings.

Enable TRON (USDT-TRC20) and enter your own T-prefixed receiving address. The server validates the Base58Check checksum. Do not use sample/test addresses for real payments. Buyers see the seller address, a TRON / USDT-TRC20 network badge and a required 64-character hexadecimal TRON transaction ID. The amount must be priced in USD or USDT. A TxID is not proof of payment: the seller must verify the transfer before fulfillment.

TRON always creates a direct pending USDT/TRON order with escrow_status NONE and zero platform escrow commission. It cannot enter Admin escrow even if the store requires USDC escrow. Duplicate TRON TxIDs are rejected. Existing USDC admin-wallet behavior is unchanged. Pricing now correctly lists eight methods.

## Digital products and delivery privacy

Mark an item Digital Product in its Add/Edit form. Older items in the Digital Product category default to digital; an explicit delivery flag is preserved. Optional post-payment instructions and an HTTPS download link are saved with the seller catalog. Do not place private download links or license keys in public descriptions or images.

The public storefront read removes those private fields, and newly generated compressed shop snapshots omit them. Checkout never shows a private download merely because a buyer typed a TxID. The order stores a private snapshot of its digital delivery data so later catalog edits do not change what that buyer purchased.

Digital-only bags hide physical shipping fields in the shopping bag, direct checkout, COD and USDC escrow order form. Mixed carts retain shipping fields. The server derives digital-only status from stored products rather than trusting a client flag; physical COD still requires an address.

For verified USDC escrow orders, access is available after Admin verification (held status). For direct methods including TRON, the seller must verify payment and save fulfillment in the existing dashboard; that records seller confirmation and releases digital access. Existing authenticated order status checks and the new Check Digital Delivery action require the Order ID and matching buyer contact. Fulfillment emails include the saved digital instructions/download link when Resend is configured; buyer-held escrow notices can include the verified order's digital instructions. No email is sent merely from submitting a TxID.

EN, FR and AR labels and RTL support are included. Card payment credentials are still entered only on external hosted checkout pages. No secrets, production data, build outputs or internal test shims are included.
