# Browser-side SF3D image-to-3D generation

This guide covers the optional seller feature that generates a textured GLB from one of the
seller's existing listing photos. It complements (does not replace) the honest photo tiers in
`docs/DECISIONS.md` (ADR-016/017/018) and the gated decision in ADR-019.

## How it works

1. The seller selects an uploaded JPG/JPEG/PNG/WebP photo and accepts the licence notice.
2. `lib/sf3d.ts` checks WebGPU, verifies the configured weight source with a `HEAD` request, and
   dynamically imports the vendored ESM producer from `public/sf3d/sf3d-producer.js`.
3. The browser streams `weights.bin`, preprocesses the image, runs SF3D, and receives a GLB
   `ArrayBuffer`. No image, prompt, or intermediate tensor is sent to GenTech or an AI API.
4. The GLB is signed through the existing authenticated `/api/v1/uploads/sign-model` endpoint and
   uploaded as Cloudinary `resource_type: "raw"` under `models/{userId}/`.
5. The existing `ListingModel` row stores the GLB plus provenance: generated/uploaded, processing
   status, source image, generator version, and a small run receipt.
6. Buyers use the existing React Three Fiber viewer. Generated models are labelled as AI
   approximations; photo tiers and seller-supplied models remain honest and unchanged.

## Installation

Dependencies are already committed: `three`, `@react-three/fiber`, `@react-three/drei`, and
`@types/three`. The SF3D browser bundle and tetrahedral grid are vendored in `public/sf3d` and
must stay together:

```
public/sf3d/
  sf3d-producer.js
  assets/*.js
  tets/*.bin
  NOTICE.md
```

Do not add source maps or `weights.bin` to this directory. To rebuild the vendored library from
upstream for an audited version bump:

```bash
git clone --depth 1 https://github.com/lyonsno/sf3d-webgpu.git
cd sf3d-webgpu
npm ci --no-audit --no-fund
npx vite build -c vite.lib.config.js
# copy dist-lib/*.js, dist-lib/assets/*.js and dist-lib/tets/* into public/sf3d
# exclude *.map and all weights
```

## Configuration

All variables are public build-time values; none are secrets.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SF3D_ENABLED` | Yes | Must be exactly `true` to show the generation flow. |
| `NEXT_PUBLIC_SF3D_WEIGHTS_URL` | Yes | Absolute HTTPS URL for an approved CORS-enabled `weights.bin` mirror. |
| `NEXT_PUBLIC_SF3D_WEIGHTS_BYTES` | Recommended | Exact expected byte count. A mismatch blocks generation. |
| `NEXT_PUBLIC_SF3D_WEIGHTS_ETAG` | Recommended | Strong ETag (`"…"`). A mismatch blocks generation. |

Published upstream mirror at the time of integration:

```bash
NEXT_PUBLIC_SF3D_ENABLED=true
NEXT_PUBLIC_SF3D_WEIGHTS_URL=https://huggingface.co/BasinShapers/sf3d-webgpu-weights/resolve/main/weights.bin
NEXT_PUBLIC_SF3D_WEIGHTS_BYTES=2285308688
NEXT_PUBLIC_SF3D_WEIGHTS_ETAG="1834d3aea4f8459a1042b63e97822ba15c2012578d76e110295d72419c1c3054"
```

The mirror reports `Access-Control-Allow-Origin: *`, `Accept-Ranges: bytes`, and a strong ETag.
Pin these values to an immutable mirror you control for production. The producer uses whole-file
loading so the browser HTTP cache can reuse the response; the first generation still transfers the
full file.

Without `NEXT_PUBLIC_SF3D_ENABLED=true`, the Generate 3D control is hidden and sellers keep the
manual GLB/GLTF upload path.

## Deployment (Vercel Free/Hobby)

1. Keep `public/sf3d` under the repository's source files. The vendored library is about 52 MB;
   weights are never committed. Hobby/Free source uploads are capped at 100 MB, so do not add
   `weights.bin` or source maps.
2. Add the four variables above in the Vercel project settings for the relevant environments.
3. Apply `prisma/migrations/20261125130000_add_listing_model_generation_provenance` with the normal
   deployment migration step before enabling the UI.
4. Deploy with the existing `vercel-build` script. No Python runtime, GPU instance, serverless
   function timeout change, or paid add-on is required.
5. Smoke-test in a WebGPU-capable browser: create a listing with a photo, accept the notice,
   generate, preview, download, save, and confirm the buyer detail page shows the generated label.

## Legal gate — must be cleared before commercial use

- `public/sf3d/NOTICE.md` records the exact upstream state. The SF3D port repository has no root
  `LICENSE` and describes the work as research/educational. Its bundled
  `@kaminos/webgpu-inference-kit@0.1.53` declares `UNLICENSED`; `xatlas-web@0.1.0` is MIT.
- The weights are under the Stability AI Community License, which permits commercial use only
  below US $1M annual revenue (or the local equivalent) and requires acceptance of its terms.
- Obtain written clearance for the runtime and document GenTech's revenue eligibility before
  setting `NEXT_PUBLIC_SF3D_ENABLED=true` in a public production environment. Until then, leave
  the feature disabled and use manual seller-supplied models.

## Limitations and failure behaviour

- Requires a browser exposing `navigator.gpu` with a usable adapter. Unsupported browsers see a
  fallback message and can still upload a GLB/GLTF manually.
- First run downloads roughly 2.1 GB and can take minutes on slower connections. Generation is
  roughly 20–40 seconds on a high-end Apple silicon device; lower-end GPUs are slower.
- One SF3D run at a time per producer. The UI disables controls during loading/generation/upload.
- SF3D does not remove backgrounds. Use a clean product photo with the item centred; the source
  is fitted to 512×512 with an alpha-masked foreground.
- Generation is an AI approximation. It must never be described as a measured scan, used to infer
  dimensions or specifications, or presented as a genuine seller-supplied model.
- Weight-size/ETag mismatch, malformed producer module, WebGPU adapter failure, empty/oversized
  GLB, signing failure, or Cloudinary failure all fail closed; no unverified model is persisted.
- Superseded generated GLBs are deleted from Cloudinary only after the DB transaction commits,
  exactly like manual model replacement/removal.

## Tests and verification

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

The unit suite covers the WebGPU fallback, licence acceptance, weight/run progress, generated GLB
upload provenance, regenerate/preview/download/remove, and buyer labelling. Real inference still
requires a WebGPU-capable browser and the pinned weights; it is not simulated in CI.
