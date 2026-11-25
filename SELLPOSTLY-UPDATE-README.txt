SellPostly cumulative source update - November 25, 2026

Extract into your existing sellpostly repository root, allowing the included source files to replace older versions. Back up your checkout first. This is a cumulative patch, not a standalone repository: existing unchanged files and dependencies are required.

Includes the simplified indigo header and three-column footer, localized homepage with interactive split preview, immediate /prompt-generator redirect to /#formatter, and photographic interactive lookbook with social share actions and story PNG export. Includes prior Spanish localization, publishing controls, integrated SEO generator and configurable $49/month B2B checkout updates.

No environment secrets, node_modules, or generated build files are included. Existing Personal Shop routes and direct crypto flows are preserved. If the earlier B2B schema update has not been applied, run npm run db:init with your existing database environment configuration before using B2B checkout. No database migration or production deployment was performed by this patch.

Run npm ci if dependencies changed, then npm test and npm run build.
Photo sources and license notes: public/lookbook/PHOTO-CREDITS.md. Models are styling inspiration and do not endorse linked products. Sample homepage prices, ratings and offers are labeled illustrative.
