# SellPostly — Compact Storefront Cards

This focused patch replaces the tall portrait product-card layout with compact
landscape cards in /shop previews and both shared public storefront templates.

## Apply
Back up your repository, then extract this ZIP at its root, replacing the matching
files. Apply on top of your existing SellPostly source and earlier patches.
Run npm run build and npm test afterward. No new dependency, database migration,
environment setting or product-data conversion is required.

## Layout
- 4:3 image frames capped at 224px, with centered object-contain photos.
- Compact 16px card padding and titles clamped to two lines.
- One-line highlight/description previews; full descriptions stay in product views.
- Removes reserved photo-credit, price, highlight, stock and video spacer heights.
- Optional photo credit, video and stock rows only appear when applicable.
- Grid: 1 column below 640px, 2 from 640px, 3 from 1024px and 4 from 1280px.
- Consistent 20px grid gaps; no fixed full-height card bodies or auto-margin gaps.
- Personal detail galleries and quick-view images retain their full-image layout.

The existing affiliate URLs/tracking parameters, Amazon price/CTA safeguards,
sharing, video, management, cart and checkout callbacks are retained. No translated
text or language routes changed. EN/FR/AR and logical RTL positioning remain.

## Verification
npm run build: passed, zero errors.
npm test: 144 passed, zero failed.
Browser checks passed in both Personal and Affiliate templates at 375px, 768px,
1100px and 1440px: correct 1/2/3/4 columns, 20px gaps, 224px maximum image height,
centered contained images, two-line titles and no horizontal overflow.
Affiliate tracking/sponsored attributes and Share Link modal were checked.
Personal quick-view image fitting, French labels and Arabic RTL were checked.
The existing non-fatal /api/import runtime re-export warning remains.
