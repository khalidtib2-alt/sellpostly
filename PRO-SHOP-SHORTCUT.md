# Restored Pro product import shortcuts

## Apply and verify

Copy this source over your SellPostly project while preserving git history and private environment files. Run npm ci and npm run build. The database schema does not change; the existing escrow-governance migration remains required for the rest of the app.

The Windows checkout was write-protected, so this ZIP contains the staged implementation rather than changes applied in place. No live database or deployment was modified.

## Homepage

The homepage now wraps its content in a client-side Pro verification provider. There is no shortcut in server-rendered or Free UI. A saved sellpostly-pro-key must be verified by POST /api/pro/verify, with the key in x-pro-key and an explicit valid: true response.

Verification runs on mount, focus, relevant storage changes and periodically while visible. A missing key produces no verification request. Failed, revoked, stale-key or unavailable verification keeps the button hidden. Clicking the shortcut performs a fresh verification before transferring anything.

When Seller Mode has a product name and Pro is verified, Send to My Shop appears beside the product controls. It uses current Product Name, Price/Currency, Key Features/Description, the clean original uploaded/imported image and product/affiliate link. It does not save the rendered promotional canvas with text baked into it.

The product is written under sellpostly_pending_shop_item, then the browser navigates cleanly to /shop. Raw local photos do not go into query parameters. Large data images are resized/re-encoded locally before handoff; remote image URLs are preserved. Storage/photo failures leave the user on the formatter with a localized error.

## Chrome Extension

Reload the unpacked chrome-extension directory at chrome://extensions after replacing the files, because this update adds background.js as a Manifest V3 service worker. Permissions remain activeTab and scripting; no storage, tabs or host permissions were added.

Seller Mode includes Send to My Shop (Pro) alongside Open Full Studio. If needed it reuses Import From Current Page to capture missing title, price, description and image. Existing popup edits are preserved. It sends the current product and active page URL to the extension's own background worker.

The worker validates and bounds the data, assigns a stable import ID and opens /shop on the same deployment already used by the extension's Website link:
https://sellpostly-git-main-usidk-it.vercel.app

This URL is kept consistent with the supplied extension. If your deployment changes, update SHOP_SITE in background.js and the existing extension links together.

Product JSON travels in a URL fragment, not the HTTP query string. This avoids long Amazon/affiliate URL and image URL request-line errors. The fragment contains product data only, never a Pro license key. No blank tab is opened.

The extension does not try to read the website's localStorage or authenticate a license itself. The website's /shop gate verifies Pro as before. The fragment stays in the browser until the builder is unlocked and can import it, so activation does not discard the product.

## Shop import and descriptions

The builder consumes any recoverable pending product, then stages a valid extension fragment and imports it. The pending object receives a durable ID before catalog persistence. The catalog is saved before pending cleanup, and the same ID cannot be added twice by a retry, refresh or Strict Mode remount. Failed catalog storage retains recoverable pending data.

The URL fragment is removed only after it has been safely staged in localStorage. Existing short addTitle/addPrice/addImage/addUrl query imports remain supported; addDescription is also recognized. Buyer-only shared views do not consume seller imports.

Imported products use Top Deals and All / Unisex by default and open their category on arrival. Sellers can change classification in the existing editor. Product descriptions now survive local saving, validation, public publishing, editing, storefront previews and Create Social Post. Existing products with no description remain compatible.

Importing changes the local builder, not the live published storefront. Use the existing publish/share action when ready to update the public shop. Pro authentication and admin-only escrow settings remain enforced by existing server APIs.

## Languages and tests

New homepage and extension labels, busy states and feedback are translated in EN, FR and AR, preserving the existing language switchers and Arabic RTL.

Twenty isolated tests passed, including Pro visibility verification rules, clean photo/description retention, exact-once import, storage recovery, long fragment payloads, trusted deployment routing, background message ownership and unchanged permissions. Existing checkout, escrow, disputes and admin tests also pass. Extension JavaScript syntax and Free UI rendering checks passed.

The production build passed with zero errors. Tests use isolated PostgreSQL and browser/extension API simulations; a real unpacked Chrome extension should be reloaded and exercised against your deployed /shop after applying the ZIP. In the restricted execution runtime, tsx required a temporary os.userInfo fallback; that environment-only shim is not shipped. npm test remains the normal developer command.

