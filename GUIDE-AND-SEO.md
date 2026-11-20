# SellPostly guide, social icons and storefront SEO

This patch adds a shared EN/FR/AR seller and buyer guide to the homepage and /how-it-works. It includes four seller steps, three buyer steps, four audience cards and five FAQ answers. FAQPage JSON-LD uses the same localized questions and answers shown on the page, with script-safe serialization. Language and RTL behavior use the existing context.

Both public storefront types have store-specific title, description, canonical URL, OpenGraph and Twitter summary_large_image metadata. A generated 1200x630 PNG shows public store branding and product names; it does not fetch seller-supplied images or show product prices. Suspended/missing stores are noindex and do not expose store details in previews. The legacy /s/slug URL uses the dedicated store type as its canonical destination.

The sitemap adds /how-it-works and the dedicated affiliate/personal URLs for published, non-suspended, non-empty catalogs. It refreshes every five minutes. Database unavailability leaves static routes available; newly published stores appear when the database is configured and the sitemap refreshes. Do not submit private /shop preview query links as public store URLs.

Product card Copy / Share Link controls reuse the existing social share modal. Personal products use their detail route; affiliate products use an anchored store URL, preserving the external merchant CTA. Shared catalog snapshots remain in preview product links. Local unpublished catalogs follow the existing publish/share flow before producing a public link.

## Social profile configuration

Set any of these optional public variables to a real HTTPS profile URL, then rebuild/redeploy:

NEXT_PUBLIC_SOCIAL_TIKTOK_URL
NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL
NEXT_PUBLIC_SOCIAL_FACEBOOK_URL
NEXT_PUBLIC_SOCIAL_YOUTUBE_URL
NEXT_PUBLIC_SOCIAL_PINTEREST_URL
NEXT_PUBLIC_SOCIAL_X_URL

Profile domains are validated for their platform. If unset or invalid, Facebook, Pinterest and X provide share actions; TikTok, Instagram and YouTube open the sharing guide. No fictitious profile links are created. Icons are local inline SVGs with accessible labels.

Set NEXT_PUBLIC_APP_URL to your canonical production origin. If it is absent or unsuitable, storefront sharing and the sitemap use https://sellpostly.vercel.app. Rich preview appearance, crawler cache refreshes and search indexing depend on each platform. FAQPage markup does not guarantee a Google rich result.

Amazon Affiliate safeguards, separate Personal Store checkout behavior and existing product photos remain intact. No npm dependency additions or database migrations are required. Run npm run build and npm test after applying.
