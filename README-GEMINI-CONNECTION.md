# SellPostly — Gemini Connection & Exact Error Diagnostics

Apply this ZIP over the existing SellPostly repository after Import 1.0.8.
It includes the previous Content Creator patch and this shared-transport fix.
Back up the repository, extract at its root replacing matching files, and run:
npm ci
npm run build
npm test

Set the private GEMINI_API_KEY server environment variable. Restart development
or redeploy after changing it. Never use a NEXT_PUBLIC_ variable for this key.
No database migration is needed. No secrets are included.

## One shared server helper
src/lib/gemini.ts now serves both the Content Creator writing endpoint and the
seller product/bio copywriter.
- Key cleaning: trim().replace(/^['"]|['"]$/g, ''), followed by whitespace cleanup.
- The complete official URL is:
  https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={encodedServerKey}
  The shorthand https://googleapis.com{model} is not a valid Gemini endpoint.
- Model attempt order: gemini-2.5-flash, gemini-3.8-flash,
  gemini-3.5-flash-lite, gemini-flash-latest.
- Requests contain ONLY contents and systemInstruction. No generationConfig,
  temperature, topP, topK, frequencyPenalty, presencePenalty, thinkingConfig,
  responseMimeType or maxOutputTokens are sent.
- Availability/quota/transient failures can advance to the next model. Global
  authentication/billing-denial HTTP 401/403 errors stop immediately.
- The model names are attempted as requested; availability depends on Google and
  the project. Unsupported model IDs produce Google's actual diagnostic.

## Exact error reporting
Both /api/ai/write and /api/ai/generate-copy preserve the final Google HTTP error
status and error.message. Each failed model attempt is returned for inspection.
The UI displays HTTP <status>: <Google message> and an expandable translated
Google Model Attempts list. It does not replace these errors with a generic
model-unavailable notice. Google messages are rendered as plain text, not HTML.

The only intentional message redaction is the configured API key or key query
value if Google echoes it. No request URL containing credentials is logged.
Local configuration/input notices remain localized in EN, FR and AR.
The Content Creator never substitutes static template content for a failed call.

The two-step Keywords -> Editable Prompt -> Finished Content workspace, Markdown
download, translations/RTL, real imported photos and existing image tools remain.

## Verification
npm run build: passed, zero errors.
npm test: 138 passed, zero failures.
Tests mock Google, covering quote cleanup, all four model IDs, two-field payloads,
exact upstream 400/401/403/404/429/503 status and messages, and key redaction.
Browser diagnostics were checked in EN/FR/AR with Arabic RTL.
No paid Google calls or live-customer key verification were performed.
The existing /api/import runtime re-export warning remains non-fatal.

The included prebuild/pretest cleanup script removes only the obsolete
generate-product-image route/component from earlier patches. Saved images and
catalog data remain. Run node scripts/remove-image-generator.mjs before npm run dev
if you skip building first.

Official API reference: https://ai.google.dev/api/generate-content
