# Peer-to-peer payments and USDC-only escrow

## Apply and initialize

Merge this source patch into your existing SellPostly checkout. Before enabling the new order methods in production, initialize the updated schema against your configured database:

npm run db:init

The schema extends payment methods and escrow status constraints, prevents direct orders from entering escrow, and adds idempotent direct-order request IDs. It is tested on a fresh database and with repeated initialization after direct and escrow orders exist. No live database migration or production deployment was performed for this patch.

## Seller setup

In My Shop, choose Personal Store, then configure Seller Payment Methods. Toggle any combination of Bank Transfer, hosted Card Link, PayPal, Payoneer, Wise, USDC and COD. Use Save Payment Settings to publish the settings with the Personal catalog. They are persisted in catalog JSON in Neon and in local/shared catalogs.

Enabled payment instructions are visible to buyers. Bank details support valid IBAN checksums or a 24-digit RIB, and an 8/11-character SWIFT/BIC. Hosted card links must be HTTPS. Other providers accept their configured payment link, email, or Wisetag. USDC direct payments use the seller's configured wallet and network.

Incomplete or invalid method details are not offered at checkout. Older shops default to their existing COD/USDC flags and required USDC escrow when legacy escrow was enabled.

## Buyer checkout

Payment Options is available from Personal Store cards, product landing pages and the cart. Buyers choose a method, view/copy the instructions, and optionally record a payment reference. Hosted card checkout opens the seller's external payment provider directly. PayPal/Payoneer email recipients and Wisetags can be copied into the buyer's own provider app.

Direct orders are recorded as pending with escrow_status=NONE, zero commission and no escrow release deadline. A reference does not prove payment; the independent seller must verify receipt before fulfillment. The order ID is shown to the buyer. Multiple products use server-calculated quantities and current catalog prices; stale catalogs and insufficient stock are rejected. Direct fiat totals support USD, EUR, GBP, MAD, AED and SAR. Direct USDC accepts USD/USDC prices without converting other currencies.

POST /api/orders/peer accepts only method, request_id, slug, item IDs/quantities, buyer contact, delivery note, reference, language and an escrow selection. Server-side whitelist construction prevents arbitrary client fields from being stored.

## USDC-only governance

- off: USDC pays the seller directly.
- optional_for_buyer: Enable Escrow Protection (USDC) starts unchecked. Checked uses the existing configured Polygon USDC escrow wallet; unchecked pays the seller wallet directly.
- required: USDC must use escrow, enforced server-side even if the buyer sends escrow:false.
- Bank, Card Link, PayPal, Payoneer, Wise and COD remain direct regardless of the USDC escrow policy.

The escrow order core status remains pending for compatibility with the existing admin workflow. escrow_status=PENDING_FUNDING and the buyer label Pending Funding represent pending_funding; admin verification moves it to HELD and release to RELEASED. A submitted TxID is not automatic payment verification. Existing hold periods and buyer-confirmed force-release requirements remain in force. Direct orders cannot enter held/released/disputed escrow states or contribute to escrow payout balances. Admin escrow actions are disabled for direct orders. New storefront USDT escrow submissions and USDT payment verification are rejected; the separate Pro subscription payment flow is unchanged.

NEXT_PUBLIC_ESCROW_WALLET must contain the platform's valid Polygon escrow wallet to enable USDC escrow. SellPostly does not initiate transfers, hold private wallet keys, or integrate with bank/card processing APIs in this patch.

## Card data and platform notice

There are no card-number, CVV, expiry or card-entry widgets in SellPostly checkout. Only the external hosted URL and a payment reference are used. The server rejects explicit card-data fields and recognizable card-number payloads in the new order flow; unknown fields are never copied into order details. No card data is logged by these handlers. A hosted link is not proof of the provider's compliance: sellers remain responsible for choosing an appropriate processor. This implementation is not a PCI-DSS certification.

A permanent EN/FR/AR SaaS/non-representation notice appears in the footer, Terms, buyer storefront footer and checkout, including alongside the USDC escrow toggle. Affiliate checkout behavior and Amazon-only safeguards are unchanged.

## Verification

npm run build
npm test

Tests cover all direct methods, exact amounts, configuration persistence, USDC-only governance, rejected card fields, direct/escrow ledger isolation, migration reruns, translations and existing Affiliate behavior.
