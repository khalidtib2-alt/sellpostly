# SellPostly Gemini Creator Tools Patch

Apply these files to the repository root after the Trust Policies / Admin Plans patch, preserving the existing project. This is a focused source patch, not a full repository. No database migration or new npm dependency is needed.

## Configuration

Optionally set GEMINI_API_KEY in .env.local and your deployment's server environment. Never prefix it NEXT_PUBLIC_ or commit its value. Restart/redeploy after configuration.

Copy generation uses gemini-2.5-flash. Image generation uses gemini-2.5-flash-image. Both call Google's generateContent REST API. Copy falls back to localized local templates when unconfigured/offline/provider errors occur. Image generation shows a localized unavailable notice and a copyable prompt when unavailable; it does not pretend a fallback image was AI-generated.

## Included

- Compact Overlay Badge canvas layout with no empty badge when Custom Title is blank.
- Editable EN/FR/AR description, three highlights, caption, store bio, script and visual prompt assistance.
- Text-only, controlled brand-free 4:3 studio-photo prompts. No Amazon images or source URLs are sent to the image provider.
- Review checkbox before applying generated images; representative-image disclosure retained through shop handoff and storefront cards.
- Existing Amazon price/image guardrails, catalog separation, plan limits, policies and payments retained.
- Privacy copy distinguishes local tools from optional Google generation.

## Validation and limits

npm run build and npm test were run against the staged complete source. 108 tests pass, including mocked Gemini success/failure, localized fallbacks, request guards, image handoff and badge geometry. Browser checks cover homepage autofill, tools fallback and EN/FR/AR/RTL switching. Live Google billing/model access was not exercised; provider calls were mocked for tests. No production deployment or database change was performed.

Routes enforce same-origin requests, bounded payloads, timeouts and best-effort per-process rate limits. Configure Google project quotas for billing protection; these in-memory limits are not a durable global quota. Optional generation sends entered text to Google; local templates and browser media editing remain available without it.

Generated pictures are representative generic imagery, not exact branded product photos. Automated prompts cannot guarantee legal/trademark or program compliance: review images for logos, text, recognizable designs and misleading product claims before publishing. Existing affiliate disclosures remain necessary.

Official API documentation: https://ai.google.dev/gemini-api/docs/image-generation and https://ai.google.dev/api/generate-content
