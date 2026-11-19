# Transactional emails, WhatsApp quick replies and canonical URLs

## Apply

Extract the ZIP over the SellPostly checkout. Keep your existing real environment files. This package includes no real secrets, node_modules or build output.

Configure these variables before building:

- NEXT_PUBLIC_APP_URL: your permanent public production origin, for example https://your-production-domain.example. Default: https://vercel.app. Use HTTPS; preview origins containing -git- are rejected.
- RESEND_API_KEY: server-only Resend API key.
- EMAIL_FROM: your verified Resend sender. Default: SellPostly <onboarding@resend.dev>. Configure a verified sender/domain for production recipients.
- ADMIN_NOTIFY_EMAIL: receives dispute alerts.
- ADMIN_NOTIFY_LANGUAGE: optional en, fr or ar for admin alerts; defaults to en.
- Keep DATABASE_URL, ADMIN_SECRET_KEY, existing Pro variables, Polygon receiving address and pricing settings.

Run the existing protected POST /api/db/init with x-admin-secret matching ADMIN_SECRET_KEY to apply the idempotent migration. It adds private subscription email/language preferences, upgrade-request language, and a successful-email delivery ledger. Existing approved crypto subscriptions are backfilled from their upgrade request; an explicitly disabled notification email stays disabled. The key issuance function now snapshots email/language into each crypto subscription.

Run npm run build, then deploy. NEXT_PUBLIC settings are build-time values. Reload the unpacked Chrome extension after replacing its files.

## Canonical website and extension links

src/lib/public-url.ts is used for metadata, sitemap/robots, published shop links, admin storefront links and email calls to action. It never derives public links from window.location or a Vercel preview environment variable.

npm run extension:configure runs automatically before npm run build. It uses Next environment-file precedence to generate chrome-extension/app-config.js, manifest.homepage_url and popup website links from NEXT_PUBLIC_APP_URL. Only this public origin is written into extension configuration; server credentials are excluded. The standalone extension cannot read process.env at runtime, so re-run this build/configuration command when changing the origin.

## Automated email triggers

The integration uses fetch with the official Resend endpoint https://api.resend.com/emails. Templates include localized subjects, plain-text and escaped HTML bodies in English, French or Arabic, including Arabic RTL layout. No new SDK is needed.

- Admin approves a Pro upgrade: email the issued license to the request email, in the request's saved language.
- Admin verifies an order: email the buyer's email contact with order ID, amount, network, and snapshotted escrow days.
- Seller saves tracking/digital delivery notes: email those saved details to the buyer.
- Buyer opens a dispute: email ADMIN_NOTIFY_EMAIL with the store, order and reason.
- Admin marks a seller payout paid: email the private subscription notification address.

Orders save the buyer's language at submission. Phone-only buyer contacts do not receive email. Buyer checkout now offers an optional international WhatsApp phone alongside the existing contact field.

The dashboard has a private Seller Notification Email form. Save it in your preferred site language. Crypto-issued subscriptions start with the upgrade request's email/language; master/Gumroad sellers can configure this address too. A blank saved email disables seller notification mail. These preferences are stored on subscriptions and are never published in shop catalogs or shareable links.

## Failure behavior

Without RESEND_API_KEY, notification dispatch is a no-op, including during builds and tests. An unset ADMIN_NOTIFY_EMAIL skips dispute mail. Email failures and timeouts never undo or reject a completed order, fulfillment, payout or license update. Delivery is awaited with a five-second HTTP timeout.

Successful email events are recorded and skipped on subsequent attempts. Resend receives a deterministic Idempotency-Key to prevent concurrent duplicate sends. Identical fulfillment content is sent once; changed content creates a new event. Logs do not print license keys, email bodies, addresses or API keys.

This is best-effort inline delivery, not a scheduled queue. Failed attempts are not marked sent; a later invocation of the same event can retry. There is no background retry scheduler in this update. The existing issued-key screen, buyer order-status portal and dashboard remain the source of truth if email is unavailable.

## WhatsApp quick replies

Order rows and the fulfillment drawer offer Order Confirmed, Digital Key / Tracking Delivered, and Delivery Follow-Up. Messages use the current EN/FR/AR site language, store name, order ID, and delivery reference/notes. The drawer uses the values currently being edited.

Links open a WhatsApp draft; no message is sent automatically. An international buyer phone is required. Email contacts are never converted into phone numbers. Caption previews are safely capped at 800 characters for WhatsApp routing.

## Extension classifications

The popup includes all seller categories, including Digital Product, Art and Sport, plus Unisex, Women, Men and Kids. Labels are translated while payload values remain stable. The service worker validates selections and sends them with the product using the existing fragment handoff, preserving long image/product URLs. /shop imports the selected category and audience; Kids is supported in editing, badges, filters, saved catalogs and compressed links. Existing products default to Unisex.

## Validation

npm run build: zero errors.
27 tests pass, covering existing escrow/Pro behavior, database schema reinitialization, all five email events, provider/DB failures, HTML escaping, localization/RTL, successful-delivery deduplication, canonical extension configuration, phone sanitization, and category/audience handoff.

Tests use mocked Resend requests and an embedded PostgreSQL database; no live emails, real payment transfers or production database initialization were performed.

Official API reference: https://resend.com/docs/api-reference/emails/send-email

