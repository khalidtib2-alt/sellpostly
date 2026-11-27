SellPostly Instant Cutout + Product Photo Preview

Apply: extract into the SellPostly repository, preserving folders. No new npm
dependencies or server APIs. Run npm test and npm run build after applying.
This includes the existing sticky-left preview/right inspector studio layout.

Homepage: product photo preview is 176px tall, contained without stretching,
with a translated remove button. Removing also clears the file input so the
same photo can be uploaded again.

Instant Cutout: no network or model downloads. A dominant border-color sample
feeds an edge-connected flood fill with alpha feathering, capped at 1280px on
the longest edge. The tolerance slider recomputes from the ORIGINAL photo,
never repeatedly damaging an already-cut-out result. Enclosed matching-color
areas stay intact. White products against white backgrounds and busy scenes
can require AI/manual editing; no 90-percent success claim is made.
A synthetic 1280x1280 uniform-background pixel-pass benchmark took 132-159ms
in the development Node runtime. Browser drawing, encoding and device speed
can change end-to-end timing; sub-200ms is not guaranteed on every device.

AI Cutout: explicitly opt-in, runtime ESM CDN import inside a module worker.
Uses Xenova/modnet q8 (~6.6MB weights), falling back to fp32 if q8 fails.
Transformers.js and WASM are downloaded only on AI request. Browser caching
can reuse model files. MODNet is portrait-focused: results on arbitrary
product scenes vary. Images are processed locally, not uploaded to inference.
Restricted CORS images should be uploaded from the device instead.
Runtime: https://github.com/huggingface/transformers.js (Apache-2.0)
Model: https://huggingface.co/Xenova/modnet (Apache-2.0)

Backdrops, restore-original, comparison slider, crop, export, badges,
watermarks and selected-shop publishing share the same output pipeline.
PNG/WebP retain transparent pixels; JPEG fills transparency with white.
Restore cancels AI work, retains the original photo and preserves crop/polish.

Verification: production npm run build passed, full npm test passed
(186 tests), plus the subsequently added SSR control-render test passed.
TypeScript passed after all edits. Additional tests exercise uniform colors,
enclosed details, alpha feathering, tolerance, bounded sizes, translations,
worker cancellation/progress, and render without model downloads.
Live CDN AI inference still requires a browser runtime check.
