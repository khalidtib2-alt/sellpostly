# Escrow governance update

This document supersedes the hold-assignment and early-release rules in the earlier milestone notes.

## Apply before use

1. Copy the supplied source over your SellPostly project, preserving private environment files and git history.
2. Run npm ci.
3. Configure DATABASE_URL and ADMIN_SECRET_KEY as before.
4. Rerun POST /api/db/init with the x-admin-secret header. The idempotent migration adds orders.force_released_at and updates the hold/payout functions. Run initialization before using the new admin order actions or dashboard.
5. Run npm run build, then open /admin directly and log in with ADMIN_SECRET_KEY.

No live database or local checkout was modified by this implementation. The supplied ZIP contains the staged source. No signing or transfer execution was added.

## Admin-only hold assignment

A new shop uses the existing database default of seven days. The seller builder no longer has an escrow-period editor. It displays a read-only Admin-assigned escrow hold notice, defaulting to seven while settings load. Authenticated GET /api/shops returns the owner's current database assignment; it is refreshed when the builder loads and regains browser focus. The seller dashboard also displays the assignment.

Publishing ignores seller-supplied escrowHoldDays. The shop insert does not accept that field and its conflict update never changes shops.escrow_hold_days. A forged localStorage value or manually crafted publishing request cannot set the authoritative period. Public storefronts read the column from the database, overriding any stale hold copied into catalog JSON.

In /admin → Stores, every row has a 3–15 day selector. Changing it saves through the protected POST /api/admin/shops/[id] endpoint using:
    { "escrow_hold_days": 10 }

PATCH is also supported. Only integer values 3 through 15 are accepted. Existing verified/suspended flags are preserved when only the period is supplied. Admin authentication still requires x-admin-key.

Changing a store's assignment affects only future orders. The order trigger continues to snapshot the assigned period at insertion and preserves that snapshot on updates. Existing escrow_release_at values are not shortened or lengthened by later shop changes.

## Clear order controls

Every admin order row shows Verify & Hold, Release Funds, Refund Buyer and Cancel. Inapplicable actions remain visible but disabled. Clicking an action opens the existing review form with the action already selected.

Status pills distinguish:
- Pending TxID
- Held Until plus the release date
- Ready to Release
- Released
- Disputed
- Refunded (or Cancelled where applicable)

The admin list refreshes its time-based status display periodically. With zero orders, a clearly labeled empty-state workflow preview shows the statuses, explains the steps and displays disabled sample controls. It never creates fake orders or alters balances.

Verify & Hold records the checked payment, moves pending to held and starts the order's snapshotted hold. Refund Buyer and Cancel retain the existing permitted transitions. All actions remain accounting decisions; actual external transfers must be carried out separately.

## Buyer-confirmed early release

Ordinary release still requires the deadline to have passed:
    { "action": "release", "forceRelease": false }

A protected admin request can override the deadline:
    { "action": "release", "forceRelease": true, "note": "Buyer confirmed receipt" }

An override requires all of:
- a verified payment
- an order currently held or disputed
- a recorded matching-buyer receipt confirmation, dated no earlier than verification
- an explicit boolean forceRelease: true from the authenticated admin

Strings such as "true" are rejected. A buyer-supplied forceRelease flag cannot release funds. Seller endpoints cannot authorize overrides.

The UI offers Force Release (Buyer Confirmed) in the release review form. It is disabled until a confirmation exists in the loaded order. Refresh the admin data after a buyer confirms. The backend and database recheck the evidence regardless of what the UI shows.

A buyer can now confirm receipt on a held or disputed order using the existing order ID/contact-matched endpoint. Confirmation on a disputed order preserves disputed status and its evidence; it does not settle the dispute or release funds. The admin must still explicitly decide to release.

The original escrow_release_at and escrow_hold_days remain unchanged for audit. A forced early release writes the new server-controlled force_released_at timestamp and an admin_actions entry with force_release and the review note. The database refuses direct early release without this valid buyer-confirmed transition, refuses inventing the confirmation in the same update, and prevents removing or changing a recorded override.

An authorized early release makes the released seller net balance eligible immediately. Both seller dashboard accounting and request_seller_payout use the same rule: released and (original deadline elapsed or force_released_at is present). Existing payout reservations and the $10 minimum remain in force. This change records eligibility; it does not automatically send funds.

## Verification

Twelve isolated PostgreSQL/authentication tests pass, including:
- forged seller publishing cannot overwrite a period
- public and seller settings read the database assignment
- 3–15 integer validation and default seven
- assignment changes leave prior order snapshots intact
- normal early releases and unauthenticated force requests fail
- buyer confirmation alone never releases an order
- confirmed disputed orders still require admin override
- force release preserves the original deadline and creates immutable audit evidence
- forced-release available balances and payout reservations agree

Additional rendering checks cover the zero-order workflow and deadline/status pills. Tests use PGlite rather than a live Neon database. In the restricted execution environment, tsx required a temporary os.userInfo fallback; that environment-only shim is not part of the supplied source. npm test remains the normal developer command.

New UI text is translated into English, French and Arabic through the existing context, including RTL support.

