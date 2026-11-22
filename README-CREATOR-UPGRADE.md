# SellPostly — Creator Controls, Drafts & Exports

Apply this source patch over your SellPostly repository after Import 1.0.8.
It includes the previous Gemini connection/Content Creator changes plus this update.
Back up your repository, extract at its root replacing matching files, then run:
npm ci
npm run build
npm test

No new dependencies or database migration are required. Keep GEMINI_API_KEY in
the private server environment for live generation. No secrets are included.

## Writing preferences
Tone: Professional, Casual, Persuasive, SEO-Optimized, Empathetic & Purpose-Driven.
Length: Short (~300 words), Medium (~600 words), Long (~1,000+ words).
Lengths are writing targets for the finished content, not hard truncation limits
or requested lengths for the intermediate reusable prompt.

The optional Humanitarian & Community Observations control and 300-character
focus note reach BOTH Generate Prompt and Write Article. Instructions emphasize
practical, inclusive observations without invented experience, impact statistics,
stereotypes or unsupported social-good claims. Inactive focus notes are not sent.

Requests send only the topic, edited prompt and selected writing preferences.
Previous generated articles and saved history are not included in Gemini requests.

## Copy and export
The finished-output bar offers Copy Markdown, Copy Plain Text, Download .md and
Download .txt, with immediate confirmation. Plain-text conversion removes common
Markdown formatting, preserves link destinations, code and Unicode, and handles
headings, lists, blockquotes, tables, emphasis, images and reference links.

## Safe reset
Clear All asks for confirmation. Cancel preserves the workspace. Confirm resets
the topic, content type, tone, length, community toggle/note, prompt and article,
while retaining the selected language and all saved drafts. It flushes pending
edits to the active saved draft before clearing. In-flight generations are aborted
and stale results cannot refill a cleared workspace.

## Saved drafts
- Key: sellpostly-creator-drafts-v1, stored in this browser only.
- Up to 20 recent drafts, ordered by timestamp; no server history upload.
- Saves topic, content type, language, tone, length, community settings, timestamp,
  edited prompt and generated output.
- Generation saves immediately; inline edits save after 500 ms, with best-effort
  flush on page exit/navigation. Further content generation updates the active
  draft; generating a new prompt starts a new history entry.
- The collapsible Saved Drafts panel supports reload, copy and individual deletion.
- Loading restores controls, prompt, content and the saved language/RTL setting.
- Deleted active drafts are detached so autosave does not recreate them.
- Full, blocked or corrupted storage shows a notice; users can still edit/export.
- Language changes preserve the old-language draft before starting a new output.

## Verification
npm run build: passed, zero errors.
npm test: 144 passed, zero failures.
New tests cover control validation, both Gemini steps in EN/FR/AR, humanitarian
instructions, payload size, Markdown/plain exports, 20-draft retention, edits,
delete, invalid/full storage, fresh reset state and translation coverage.
Browser checks passed for both copy/export formats, cancel/confirm Clear All,
draft reload across page refresh, deletion, translated controls and Arabic RTL.
Google requests were mocked; no paid live API requests were made.
The existing non-fatal /api/import runtime re-export warning remains.

The existing shared Gemini transport retains quoted-key cleanup, the requested
four-model attempt order, contents/systemInstruction-only Google payloads, and
exact upstream HTTP diagnostics with credential redaction. Content Creator has
no static-template substitution. Real imported photos and Studio tools remain.

The included prebuild/pretest cleanup removes only the obsolete AI image generator
route/component from earlier patches. Run node scripts/remove-image-generator.mjs
before npm run dev if you skip building. Saved photos and catalogs remain intact.
