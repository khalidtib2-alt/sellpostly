SellPostly Browser Background Studio Update

Extract these files into your existing SellPostly repository, preserving folders.
This builds on the sticky-left preview / right-hand inspector layout.
No npm dependencies added. Run npm test and npm run build after applying.

Features: on-demand browser WASM background removal; cancel/restore original;
transparent, white, alabaster, obsidian and custom backdrops; pointer/touch and
keyboard-accessible before/after comparison; EN/FR/ES/AR translations.
PNG/WebP preserve transparency; JPEG flattens transparent pixels to white.
Crop, resizing, polish, badges, watermark and selected-shop publishing remain.

Runtime: pinned Transformers.js 3.7.2 is loaded with native dynamic import in a
module worker only on request. BiRefNet_lite-ONNX runs locally (single-thread
WASM), with a first-use model download and browser cache. Photos are not sent to
an inference API. Internet access to jsDelivr/Hugging Face and browser support
for module workers, WebAssembly and OffscreenCanvas are required. Restricted
CORS photos should be uploaded locally. Removal errors leave the original intact.
The runtime may use substantial memory and take minutes on low-powered devices.
Input to inference is limited to 2048 px; output retains selected export size.

Runtime licenses and upstream sources:
Transformers.js (Apache-2.0): https://github.com/huggingface/transformers.js
BiRefNet model (MIT): https://huggingface.co/onnx-community/BiRefNet_lite-ONNX

Verification: unit tests cover backdrop/alpha rules, divider bounds, localized
controls and worker progress/success/cancellation. Actual CDN model inference
requires browser verification; no claim of visual segmentation quality is made.
