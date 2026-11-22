# SellPostly — Content Creator & Gemini Connection Fix

Apply over your existing SellPostly source after Import 1.0.8. This ZIP includes
the previous Gemini text-writer patch plus the simplified two-step Creator update.

## Installation
1. Back up your repository and extract this ZIP into its root, replacing matching files.
2. Run npm ci if dependencies are not installed for Import 1.0.8.
3. Set GEMINI_API_KEY in .env.local or the hosting server environment, then restart
   development or redeploy. This must be a private server variable, never NEXT_PUBLIC_.
4. Run npm run build and npm test.
5. Open Creator Mode on the homepage or visit /prompt-generator.

No database changes are needed. No secrets are included.

## Content Creator
- Keywords / Topic, Content Type (Article, Social Post, Video Script, Newsletter),
  and EN / FR / AR language controls only.
- Generate Prompt calls Gemini and displays one editable prompt box.
- Write Article from Prompt submits that edited prompt and displays the finished
  content in a second editable box directly below it.
- Copy Prompt, Copy Content and Download .md are provided in place.
- No saved-product picker, verified-product fields or duplicated prompt builder.
- No local template substitutes: failures display a translated status notice.
- Language changes cancel stale requests, clear old-language output and apply RTL
  for Arabic. Stale requests cannot overwrite a newer topic or selected language.

## Correct Google connection
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
The key is trimmed and sent only through the x-goog-api-key HTTP header.
It is NEVER appended to a domain or URL. https://googleapis.com<key> is not a valid
Gemini model endpoint and would expose the key.

The new /api/ai/write route falls back to gemini-2.5-flash-lite for model-not-found,
exhausted quota, or transient HTTP service failures. Authentication/billing errors
surface directly. Both attempts share one 50-second deadline. Provider response
size, request size and request rate are bounded. Google responses and keys are
never echoed in public errors. Partial, safety-blocked or missing model output
is reported as a notice instead of fake successful content.

Official reference: https://ai.google.dev/api/generate-content

The existing seller product/store copywriter remains available. Imported photos,
uploads, crop/resize/brightness/contrast, video covers and QR tools remain intact.

## Removing the obsolete image generator
The prebuild/pretest cleanup script deletes only:
src/app/api/tools/generate-product-image/route.ts
src/app/generation/product-image-generator.tsx
Run node scripts/remove-image-generator.mjs before npm run dev if you skip building.
Existing saved photos and historical image metadata are retained.

## Verification
npm run build: passed, zero errors.
npm test: 135 passed, zero failed.
Browser checks passed: two-step flow, exact edited prompt submission, editable
content/copy, Markdown download, FR/AR and RTL, missing-key status without template
substitution, and homepage Creator Mode without commerce or duplicate fields.
Provider calls were mocked; tests did not charge a Google account or verify a live
customer key. Model availability and quota still depend on the Google project.
A pre-existing /api/import runtime re-export warning is non-fatal.
