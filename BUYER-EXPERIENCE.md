# Buyer storefront and dispute routing update

## Install

Apply this source to SellPostly while preserving private environment files and git history, then run npm ci and npm run build. The existing escrow-governance database migration must already be applied. This update adds no schema columns or tables.

Buyer checkout now uses Polygon for both USDC and USDT. Configure the platform's public Polygon receiving address as NEXT_PUBLIC_ESCROW_WALLET and set NEXT_PUBLIC_ESCROW_NETWORK=Polygon (or leave the network unset to use its default) before building. These public values are embedded in the browser bundle; rebuild after changing them.

A deployment explicitly configured for another receiving network does not silently relabel its wallet as Polygon: QR/payment address actions and order submission remain disabled with a localized setup notice until Polygon is configured. Historic orders and payouts on other networks are preserved. Do not put private signing keys or seed phrases in any public variable.

## Buyer footer and portal

Public /s/[slug] and legacy shared /shop?s=... buyer views no longer show Edit My Own Shop. Their footer contains only a Powered by SellPostly trust line and the Dispute Order / Report Store button.

The button opens a native dialog with Order ID, matching original email/international phone, and dispute reason. The form calls POST /api/orders/[id]/dispute. It is an order-linked report portal, not anonymous general reporting. A valid held order and matching contact are required. Pending, released, refunded and cancelled orders cannot be moved to disputed through this flow.

When a published storefront slug is available, the request includes storeSlug and the server also checks that the order belongs to that store. Legacy snapshot views have no authoritative database shop slug, so they retain the existing order-ID/contact validation. No seller license is needed by buyers.

Successful submission records disputed status and the message/timestamp in details.dispute. It does not transfer money, automatically refund, or release escrow. The new message appears through the existing protected admin overview. Private contact errors use the existing generic not-found/not-eligible response; no other buyer's details are exposed. Request bodies are bounded at 8 KiB and reasons remain capped at 1,000 characters.

Suspended public storefronts also retain the footer portal. The catalog stays hidden and new orders remain blocked, but existing buyers can still dispute their held orders.

## Polygon checkout

Both token choices use the same Polygon network selection and configured escrow address. The checkout explains that this one Polygon wallet accepts USDC and USDT on Polygon only. The QR still encodes the receiving address; buyers must select the correct token, network and amount in their own wallet.

The platform must independently verify the actual transfer as in the existing admin workflow. No blockchain signing, server-initiated transfer or automatic refund is added here.

## Admin visibility

At the top of the Escrow Orders tab:
- a prominent red Disputed Orders counter filters the list to disputed orders
- All Orders restores the complete view
- disputed status pills and rows are highlighted
- the buyer's reason is visible directly on the row, without expanding Order Details

The existing Refund Buyer and Release Funds actions remain visible and retain all state, hold-period and buyer-confirmed force-release restrictions. Polling refreshes the protected overview every 15 seconds while the page is visible, and on browser focus. Polling pauses while a review dialog is open or a request is busy so unsaved review work is not interrupted.

A zero-dispute filter shows a helpful message, while a store with no orders retains the earlier empty-state workflow preview. The counter is still visible at zero. Buyer messages render as plain text.

All new labels, form states, error feedback, helper copy and admin controls are translated into EN, FR and AR using the existing language context and RTL handling.

## Verification and delivery

Fifteen isolated PostgreSQL/authentication tests passed. Added checks cover the Polygon configuration guard, matching-contact and store-scoped disputes, suspended-store dispute access, immediate visibility of the saved reason in admin overview, and request-size limits. Rendering checks cover public/shared footers, both token selections, the Polygon helper, red counter and plain-text dispute reasons.

The production build passed with zero errors. Tests use PGlite and local production/rendering checks, not a live Neon database. No live database records were modified.

The Windows checkout was write-protected, so implementation was completed in a staged copy and delivered in the ZIP. The archive excludes dependencies, build outputs, git history and private environment files. The restricted test runtime required a temporary os.userInfo fallback for tsx; this environment-only shim is not shipped. npm test is the normal developer command.

