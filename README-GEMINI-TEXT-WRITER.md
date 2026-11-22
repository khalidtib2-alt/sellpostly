# SellPostly — Gemini Text Writer Patch

Apply this patch over your existing SellPostly source after the Import 1.0.8 update.
It preserves real imported photos, uploads, stored images and product data.

## Apply
1. Back up your repository, then extract the ZIP at its root, replacing matching files.
2. Run `npm ci` if dependencies have not been installed for Import 1.0.8.
3. Optionally set GEMINI_API_KEY in .env.local or your hosting server environment.
   Keep this key private; never use a NEXT_PUBLIC_ key. No key is needed for templates.
4. Run `npm run build` and `npm test`.

The prebuild and pretest commands automatically remove these two obsolete files:
- src/app/api/tools/generate-product-image/route.ts
- src/app/generation/product-image-generator.tsx
If you start development without building first, run
`node scripts/remove-image-generator.mjs` once before `npm run dev`.
This only removes the old generator entry points, not saved photos or product data.

## Changes
- /api/ai/generate-copy is the canonical server endpoint for gemini-2.5-flash.
- /api/tools/generate-copy remains a compatibility alias for older clients.
- Product copy uses title, price, category and verified details; bio generation remains
  beside the store bio in Seller Settings, respecting the separated workspace layout.
- The homepage Creator Mode and /prompt-generator now include an inline Gemini
  Writer Panel: enter keywords or choose a saved product, generate an editable
  prompt and caption/video script, and copy each independently.
- EN, FR and AR translations and RTL layout are retained. Missing keys, offline
  requests and provider errors use localized templates with honest source labels.
- Google receives entered text only. No image-generation route or image-model calls remain.
- /studio crop, resize, brightness/contrast, uploads, video cover and QR tools remain.
- Existing stored AI-image provenance remains readable for backward compatibility.

## Verification
- npm run build: passed (TypeScript and production generation; zero errors).
- npm test: 130 passed, zero failed.
- Browser checks: saved-product facts, editable prompt/copy, FR/AR and RTL,
  in-page homepage Creator Mode, and retained Studio image/video tools passed.
- Provider calls were mocked in tests; no paid Google requests were needed.
- A pre-existing /api/import runtime re-export warning remains non-fatal.
- No database migration is required. No environment secrets are included.

The authentication regression test was updated to the current /api/pro/verify,
/api/admin/overview and /api/db/init endpoints instead of absent legacy login routes.
