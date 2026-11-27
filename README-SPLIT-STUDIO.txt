SellPostly Split Creator Studio Layout

Apply to your existing SellPostly repository after the preceding product-upgrade/cleanup update. Back up your checkout, extract this ZIP into the repository root, and replace the three included source files. No dependency installation, environment changes or database migration is required.

At desktop widths of 1024px and above, the shared image editor uses a 12-column layout: sticky preview/actions (7 columns) and editing inspector (5 columns). The preview area includes both crop and processed canvases, file-size feedback, download/reset controls, the selected shop, Send to Selected Shop and My Shop. Canvas sizes are constrained without changing their aspect ratio or crop hit area. On unusually short desktop windows the preview panel can scroll internally so actions remain reachable.

Smaller screens retain a normal single-column flow. Crop presets, four-corner drag cropping, all sliders, resize and export formats, local processing and shop handoff logic are unchanged. The shared legacy media editor receives the same layout. Existing EN/FR/ES/AR labels are reused. /tools continues redirecting to /studio.

The page route itself still renders StudioWorkspace; no route changes are needed. No files are deleted by this update. No credentials, dependencies or generated build files are included. The patch does not deploy the site.

Run npm test and npm run build after applying.
