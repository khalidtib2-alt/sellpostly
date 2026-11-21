# SellPostly Gemini Full Endpoint Fix

Apply these files at the repository root after SellPostly-Unified-Workspace-Gemini-Patch.zip. This is a focused source patch. No dependency installation, database migration or environment changes are required. Keep your existing server-only GEMINI_API_KEY.

The staged baseline already contained the full Google path; this patch hardens it with explicit, fixed URLs for every model instead of joining a base URL and model name. Both public API routes use the shared provider. No client input or environment override can replace the upstream endpoint with a bare domain.

Copy/bio/scripts: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent

Studio photos: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent with responseModalities TEXT and IMAGE, aspect ratio 4:3, and text-only unbranded input. The previously requested legacy fallback endpoints remain complete and are attempted only for unavailable models, not quota/billing failures. Legacy model availability is not guaranteed.

GEMINI_API_KEY is trimmed and passed only in x-goog-api-key. No AIza prefix validation is used; AQ. and legacy formats are passed unchanged after trimming. Google still must accept the credential, enabled APIs, billing and model access. A full URL fixes request routing; it cannot grant access to an unavailable model.

Image failures keep available:false and a copyable localized prompt, plus sanitized diagnostic code, upstream HTTP status and EN/FR/AR message. Raw provider response strings and credentials are never returned or logged. Empty-body 401/403 responses are classified as authentication failures instead of generic unavailable errors. Copy generation retains local templates and its own diagnostics independently of image errors. Existing UI diagnostic rendering and RTL support are unchanged.

Verification: npm run build and npm test were run in the complete staged source; 117 tests pass. New route-level tests mock the Google boundary and assert the exact request URLs, AQ./legacy headers, JSON modes, image modalities, safe localized quota/billing messages, prompt fallback, empty-body auth failures and continued text generation. No live Google requests, production deploys, database writes or secret changes were performed. The original read-only checkout is unchanged.

After applying, rebuild/redeploy so the server routes use the updated code. If Google returns MODEL_UNAVAILABLE, AUTH, QUOTA or BILLING afterward, use the safe diagnostic to check the corresponding project setting rather than changing the endpoint to a bare domain.
