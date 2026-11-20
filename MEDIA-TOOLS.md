# Seller Media & Storefront Tools

Merge this source patch into the existing SellPostly checkout with the previous patches applied. It adds /tools to the header, footer and sitemap. No npm packages, paid APIs, cloud media processing or database migration are needed for this update.

## Image Studio

Upload or drop a local PNG, JPEG or WebP (up to 25 MB / 40 megapixels). The Before canvas shows the original plus a draggable crop rectangle. Drag inside it to move the crop, drag the green corner to resize, or draw a new rectangle outside it. Crop X/Y/Width/Height sliders provide keyboard controls. Choose free crop, 1:1 / 4:3 product cards, 1000x1500 Pinterest, 1080x1920 TikTok/Reels/Shorts, or 16:9 banner presets.

Set exact output pixels with aspect lock, or use the resize percentage control. Export up to 4096 pixels per side and 12 megapixels total. Adjust brightness, contrast, saturation and actual convolution sharpness, then add optional corner badge and watermark text. Arabic overlay text uses explicit RTL alignment. All edits and encoding use local Canvas APIs.

WebP/JPEG quality is adjustable; PNG is lossless and its quality slider is disabled. JPEG uses a white background for transparency. Before/after KB values and savings come from the actual input File and encoded output Blob. Negative savings means the export is larger. If a browser falls back to PNG, the download extension follows the Blob's actual MIME type.

Download keeps the selected output size. Send to My Shop creates a resized, compressed copy (bounded for localStorage), saves it under the existing pending-product key, and navigates to /shop without an image query string. Set the product name and choose Personal or Affiliate destination before sending. The existing Pro gate still applies to shop editing. Storage errors are shown without removing the current image.

## Video & Social

Load a local MP4 or WebM up to 200 MB. Use the native video controls or timestamp slider, pause at a frame, choose 1:1, 2:3 or 16:9 and capture a PNG cover. Captures are 1200x1200, 1000x1500 or 1920x1080 respectively. Download the cover or send the captured image to My Shop. Video codec support depends on the browser; unsupported files show an error.

Paste a published storefront URL on the configured canonical SellPostly origin, ending in /s/<slug>/personal or /s/<slug>/affiliate. Generate a local 1024x1024 QR PNG, copy the normalized public link, or open the existing social share modal. Private /shop preview links and off-site URLs are rejected; query strings and fragments are removed.

## Optional product video

In the Add/Edit Product form, Product Promo Video accepts explicit HTTPS YouTube/watch/Shorts, full TikTok post, Instagram Reels, Vimeo or direct .mp4 links. Shortened TikTok redirect links should be replaced with a full @creator/video/<id> link. No video is scraped during import. Amazon CDN video links are rejected.

The optional promo_video_url field is stored with product JSON, including saved, published and compressed shared catalogs. Existing products default to no video. Personal and Affiliate preview/public cards show Watch Demo only for valid links; the Personal product detail page also supports it. Click Play Video to load the external host. YouTube uses the privacy-enhanced embed host. Responsive players have an Open Original Video fallback because privacy settings, embedding restrictions or private/deleted clips can prevent inline playback. MP4 playback uses native video controls. Third-party hosts' privacy rules apply once played.

Existing Affiliate disclosures, Amazon image/price rules, Personal cart and payment behavior remain intact. EN/FR/AR labels use the existing language context and RTL layout.

## Verification

npm run build
npm test

The source tests cover crop geometry, size limits, sharpening/alpha preservation, QR canonical URLs, provider URL safety, Amazon CDN rejection, product save/share persistence, translations and consent-first player rendering.

A Chrome headless check also verified a real image upload, WebP/JPEG/PNG downloads with correct file signatures, a seeked local WebM cover at 1000x1500, a 1024x1024 QR and localStorage handoff to /shop with no URL query. The tested local-tools flow recorded no external HTTP requests; product video hosting is a separate opt-in action.
