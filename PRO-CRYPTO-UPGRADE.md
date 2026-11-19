# Polygon Pro subscription checkout

This update adds manual USDC / USDT payment review and database-issued Pro licenses. Existing master keys and Gumroad verification remain available.

## Apply and configure

1. Extract this ZIP over the SellPostly repository. It contains source and configuration, without real environment secrets, build output or node_modules.
2. Keep your existing DATABASE_URL, ADMIN_SECRET_KEY, PRO_MASTER_KEYS and optional GUMROAD_PRODUCT_ID.
3. Set NEXT_PUBLIC_ESCROW_WALLET to your receiving Polygon address. NEXT_PUBLIC_ESCROW_NETWORK must be Polygon (or omitted).
4. NEXT_PUBLIC_PRO_PRICE_USD defaults to 15. This is the monthly price in USDC or USDT. Monthly licenses last 30 days from approval; there is no automatic billing.
5. Optionally set NEXT_PUBLIC_PRO_LIFETIME_PRICE_USD to your chosen lifetime price to offer a lifetime plan. Lifetime checkout is hidden until that price is configured.
6. Run the protected POST /api/db/init once with the x-admin-secret header matching ADMIN_SECRET_KEY. This idempotent migration adds pro_upgrade_requests, subscriptions.expires_at, the crypto provider, and the atomic issuance function.
7. Run npm run build and deploy. NEXT_PUBLIC values are bundled at build time, so rebuild after changing them.

Do not publish ADMIN_SECRET_KEY, DATABASE_URL or license master keys in NEXT_PUBLIC variables.

## Buyer flow

Open /shop, select Activate Pro License, then use the Polygon payment option. The address QR is generated locally, with no tracking API. It encodes the address only. Select USDC or USDT, send the displayed amount on Polygon, then submit your email and full transaction hash.

A randomly generated receipt token is stored in this browser's localStorage. Status polling checks every 15 seconds while the tab is visible, and a manual Check Payment Status button is available. Approved requests reveal their issued key and offer one-click activation through the existing verification API. Clearing browser data removes the receipt; contact support if recovery is needed.

GET /api/pro/request requires tx_id and email query parameters plus x-upgrade-token. A public transaction hash or email alone cannot reveal the key. Duplicate transaction submission returns a conflict instead of exposing an existing receipt.

## Admin flow

Unlock /admin using the existing admin key and open Pro Subscriptions. Review the new upgrade-request table. Independently verify the receiving address, Polygon network, correct token, amount, transaction finality and that the transfer has not already funded an order or another purchase. Approve & Issue Key records approval and inserts a subscription in one PostgreSQL transaction under a row lock. Retrying approval returns the same issued key; rejected requests cannot be approved.

The subscription stores the SHA-256 owner-key hash; the request preserves the issued key for authorized admin copying and receipt-protected buyer retrieval. Revoking or expiring a subscription immediately prevents future server verification. Retrying approval does not reactivate a revoked subscription or extend an expired one. The admin table shows expiration dates.

No wallet private keys, signing, automatic transfers, blockchain validation, email sending or recurring billing are implemented. A new approved request issues a new license identity; automatic renewal of an existing store license is not part of this flow.

## APIs

- POST /api/pro/request: email, plan (monthly by default), coin, network (Polygon), tx_id. Amount is selected by server configuration, never accepted from the request.
- GET /api/pro/request: tx_id, email; header x-upgrade-token.
- GET /api/admin/pro-requests: existing strict x-admin-key authentication.
- POST /api/admin/pro-requests: id and action (approve or reject); same admin authentication.
- POST /api/pro/verify: unchanged contract; now accepts active, unexpired database-issued SP-PRO keys.

All new UI strings are translated into English, French and Arabic using the existing language context and RTL behavior.

