# SellPostly — Flexible Categories & Catalog Export

Apply on top of your existing SellPostly repository and earlier patches.
Back up the repository, extract at its root replacing matching files, then run:
npm run build
npm test

No new dependencies or database migration are needed. Custom categories live in
the shop's existing JSON catalog, alongside products, and persist through the
existing localStorage, publishing and compressed shared-link mechanisms.

## Shopper filters
Public/shared storefronts and Storefront Preview show All plus categories with at
least one product. Empty category pills are omitted; an entirely empty storefront
retains All without a (0) label. Counts are based on the store catalog, independent
of the current search or audience filter. Invalid/empty active shopper categories
reset to All. Moving or deleting the last product in a selected category also
resets the manager's selection to All.

## Store Manager
Builder mode retains all built-in and custom categories, including zero-count
ones. Manage Categories is a small collapsible panel for creating categories on
demand. The product Category field offers existing options through its dropdown
suggestions and accepts new typed names. Add Category registers a category before
it has any products; saving a product with a new category also registers it.

Names normalize Unicode, case for duplicate matching, and repeated whitespace.
Duplicate names are rejected, including built-in names and active-language labels
in the creation UI. Names are bounded to 80 characters; up to 500 custom names are
retained. Deleting a product does not delete its custom category definition.
Existing product categories are migrated into the list automatically.

Category lists remain independent between Affiliate and Personal catalogs and
between specialty shop drafts. Niche storefronts retain their existing single-
collection behavior, with the broad category bar hidden.

## Export Catalog JSON
Manage Categories includes Copy Catalog JSON and Download Catalog JSON actions.
Exports contain version, shop name/type, built-in and custom category names, and
products. They can be used as a source for permanent catalog defaults.
Payment settings, seller credentials, private digital-delivery notes and private
download links are not included. The UI explains this before exporting.

## Verification
npm run build: passed, zero errors.
npm test: 152 passed, zero failed.
Tests cover empty/public vs. owner categories, selection recovery, Unicode/case
duplicates, local/shared persistence, catalog separation, public-safe JSON exports,
shopper/owner rendering and translated UI copy.
Browser checks passed: adding a custom category, rejecting a duplicate, product
assignment, last-product move/delete reset, zero-count hiding in Preview/public
views, category retention after page reload, copy/download export, and EN/FR/AR
with Arabic RTL. No production database mutations were needed.
The existing non-fatal /api/import runtime re-export warning remains.
