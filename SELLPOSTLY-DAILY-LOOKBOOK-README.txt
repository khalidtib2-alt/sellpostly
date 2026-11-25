SellPostly Daily Interactive Lookbook - November 25, 2026

This cumulative source patch includes the preceding header/homepage/lookbook polish and the new daily numberless lookbook. Back up your checkout, then extract into your existing sellpostly repository root and allow the included source files to replace their older versions. Unchanged repository files and existing dependencies are required. No secrets, node_modules or generated build output are included.

New: original generated full-length studio editorial models; numberless clickable garment zones; a subtle pointer/touch perspective stage with reduced-motion support; deterministic daily four-piece selection from the active shop catalog; shuffle and date/seed-preserving social links; shared Personal Store cart actions; Affiliate external CTAs; numberless 1080x1920 story export. All new labels support EN/FR/ES/AR. Custom seller outfit photos still override the defaults.

Daily selection uses UTC dates. When a catalog has fewer than four eligible items, it displays the available items without duplicating products. Garment diversity is prioritized; other eligible products fill gaps when a garment type is missing. Shared links pin the selected date and shuffle choice; later catalog edits can change available suggestions. Models are styling inspiration and do not depict or endorse the linked catalog products. Generated-image provenance and legacy photo credits are in public/lookbook/PHOTO-CREDITS.md.

Routes: /s/[slug]/look, /s/[slug]/affiliate/look, /s/[slug]/personal/look and /shop/look. This patch does not change checkout, subscription pricing or database records. It does not deploy the site. The earlier cumulative B2B schema update still requires npm run db:init if you have never applied that prior migration.

Verify after extraction: npm test, then npm run build.
