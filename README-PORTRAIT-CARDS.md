# SellPostly Portrait Product Cards

Apply these files at the repository root after SellPostly-Pro-Entitlement-Sync-Patch.zip. No database migration, new dependency or environment change is needed.

Product grid images in /shop builder, storefront preview, public personal/affiliate templates and the sample storefront use uniform 3:4 portrait frames and object-cover object-top. Padding is removed from grid photos, and neutral slate fallback backgrounds replace bright white backing. Color blending is disabled on these card images to retain natural photo colors. Existing card actions, product links, badges, Amazon safeguards and EN/FR/AR support are unchanged.

Product detail galleries, quick-view dialogs and fullscreen lightboxes retain object-contain, so buyers can inspect the entire photograph. Portrait frame overrides are scoped to cards and do not alter gallery frames.

Verification: npm run build and npm test were run in the complete staged source; all 125 tests pass. The image-frame regression test now checks the intended portrait cover layout and retained gallery containment rather than the superseded 4:3 layout. Browser checks inspect computed dimensions, zero padding, top alignment and dark-theme fallback colors in both storefront modes, plus contained quick-view imagery.

The original read-only checkout remains unchanged. No production deployment or database writes were performed. Apply this patch and rebuild/redeploy to update your live site.
