# Payment save, uniform cards, guide and SEO polish

Apply these source files to your existing SellPostly checkout with the prior Media Tools and Peer Payments patches installed. No new dependencies or database migration are needed for this update.

## Payment settings

Save Payment Settings now calls a dedicated save-only action. It normalizes and publishes the Personal catalog through the existing authenticated /api/shops route, updates local catalog storage, and shows an inline translated success message. It does not open the Share dialog, scroll to sharing cards, navigate, or switch preview modes. If editing continues during a save, the confirmation says that newer edits remain unsaved. Local-storage failure after a successful server save is reported separately. The ordinary Share Store / Copy Link actions retain their existing behavior.

## Product card layout

Personal, Affiliate, Signature Collection and builder card frames use 4:3 geometry with full-width/full-height contained images, 16px inset padding and a neutral studio backing (white for Midnight Slate). Featured-first-card and full-bleed representative-photo overrides have been removed. Image hover scaling no longer crops the image.

Public cards have uniform title/price/detail slots and bottom-aligned action groups, with reserved space for optional Watch Demo controls. Amazon prices are still omitted from HTML, not merely hidden with CSS; the empty layout slot keeps neighboring actions aligned. Image attribution and representative-photo captions remain present.

## Guide and FAQ

The homepage and /how-it-works share the same updated content: four seller steps, three buyer steps, six capability cards, four audience cards and five FAQs. It explains dual catalogs, Amazon-only safeguards, all seven payment methods and named hosted-card providers, USDC-only off/optional/required escrow, SaaS neutrality, local media tools, extension/URL imports, demos and QR sharing. It also distinguishes free tools from Pro storefront publishing.

The FAQPage JSON-LD uses exactly the visible localized FAQ content. EN/FR/AR and RTL use the existing language context.

## SEO

A shared metadata helper supplies focused titles, descriptions, keywords, OpenGraph and Twitter tags for the homepage, guide and tools page. Root metadata includes a generated 1200x630 branded PNG preview. Dynamic storefront metadata preserves store names and bios and adds localized storefront labels and relevant intent keywords. Client-side language changes update page titles, descriptions and social tags while keeping the existing language-neutral canonical routes.

Localized WebApplication/WebPage/CollectionPage structured data includes intent keywords and language. No product prices, bank accounts, wallet addresses or private payment configuration are added to storefront structured data. Suspended storefront noindex behavior is unchanged.

Keywords cover link-in-bio storefronts, social-commerce and affiliate shop building, Amazon affiliate stores, creator showcases, USDC/bank-transfer commerce and free media/post tools, including French and Arabic equivalents. The copy does not claim that paid Pro storefront publishing is universally free or has no monthly fees. Tools remain identified as free; pricing for Pro is shown at activation.

## Verification

npm run build
npm test

A Chrome headless run measured square, wide and tall image frames at identical heights and primary-button positions within both grid modes. It verified French/Arabic title, OpenGraph and FAQ updates, RTL direction, and an in-place payment save with unchanged URL/scroll, no open dialog and one save request. The browser save check used synthetic local shop data and mocked Pro/shop responses; no live license, database write or production deployment was used.
