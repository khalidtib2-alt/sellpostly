SellPostly 360-degree Turntable, Sharing and Shop Logo Update
November 25, 2026

Back up your existing SellPostly checkout, then extract this source patch into its repository root, replacing the included files. It requires your existing project and dependencies. No environment secrets, node_modules or build output are included. No deployment or production database write was performed. No new dependencies or schema migration are required for this update.

The lookbook uses a real multi-face 3D mannequin built from triangulated geometry in CSS 3D, with continuous pointer drag/touch swipe, 45-degree left/right controls, keyboard arrows, front/side/back labels and reset. Garment taps select the corresponding active catalog product; daily rotation, shuffle, cart behavior and Affiliate safeguards remain in place. No hotspot dots or circular rings are rendered.

Important fidelity limit: catalog photographs are applied as reference textures on a stylized mannequin; colors are inferred from product titles. This is not a photorealistic virtual try-on or reconstruction of the exact garment cut, material, fit or unseen back. The UI explicitly explains this. Non-wearable items are not painted onto clothing. Existing seller outfit photos remain optional references and can still be used for story export. Default story export uses the current mannequin angle and outfit; CORS-restricted images fall back safely to the item color in the PNG.

Share controls use platform brand colors for Instagram, TikTok, WhatsApp, Facebook, X, Pinterest and Telegram, plus Copy Link. The global share modal retains LinkedIn and Email as well.

Shop Logo upload and URL editing are available in /shop, /settings, the New Niche Shop dialog and /dashboard for any selected Personal or Affiliate store. New shops are still created from /shop. Saved logos appear in storefront and lookbook headers. Logo updates from the dashboard change only the selected catalog's logo and preserve products, payment settings and unrelated drafts. The new authenticated /api/shops/logo route enforces ownership and niche entitlement. Logo uploads are resized locally to at most 256 pixels, capped at 5 MB source size.

New UI is translated into EN/FR/ES/AR. Run npm test and npm run build after extracting.
