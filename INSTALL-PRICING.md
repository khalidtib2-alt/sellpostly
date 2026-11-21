# SellPostly pricing page patch

Merge into the existing project after the Multi-Shop and Clickable States / Main Store Link patches. This is a focused source patch, not a standalone application.

Adds /pricing, translated header/footer navigation, canonical and OpenGraph/Twitter metadata, sitemap inclusion and EN/FR/AR content with existing RTL/theme support.

Free includes the two primary stores, Chrome imports, Amazon safeguards, seven personal-store payment methods and browser media tools. Pro adds up to ten niche stores across both modes, niche-to-main links, independent niche branding and priority support. Primary-store branding remains included in Free. Direct payment/network fees and the existing 5% USDC escrow commission are disclosed separately from plan prices.

The Pro amount reads NEXT_PUBLIC_PRO_PRICE_USD with the same validation and 15 USD default as the existing monthly upgrade API. Invalid configuration shows See upgrade options rather than an invented price. Monthly crypto access lasts 30 days from payment approval; the existing upgrade window retains any configured lifetime plan and license activation options.

Upgrade to Pro links to /shop?upgrade=pro. The existing Pro gate automatically opens its license/crypto upgrade dialog even for signed-in Free users, then clears the intent parameter. Closing returns Free users to their builder. Already-active Pro users go directly to their builder without another payment prompt. Existing verification and payment APIs remain unchanged.

Run npm run build and npm test after merging. No new dependencies, migrations or environment variables are required. No production deployment or live database changes were performed while preparing this patch.
