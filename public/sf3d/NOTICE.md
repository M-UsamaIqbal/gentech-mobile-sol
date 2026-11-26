# SF3D WebGPU browser bundle — provenance notice

This directory contains a vendored library build of `lyonsno/sf3d-webgpu` produced with the
upstream `vite.lib.config.js` recipe. It contains no model weights. The seller's browser downloads
those separately from the URL configured in `NEXT_PUBLIC_SF3D_WEIGHTS_URL`.

## Contents

- `sf3d-producer.js` — ESM producer entry.
- `assets/*.js` — five Web Worker chunks emitted by the upstream library build.
- `tets/*.bin` — tetrahedral grid used by marching tetrahedra (about 52 MB total).
- `NOTICE.md` — this file. Source maps are intentionally omitted.

## Licence status — read before commercial deployment

- Upstream project: <https://github.com/lyonsno/sf3d-webgpu>
- Upstream README describes the port as being for research and educational purposes.
- The repository currently has **no root `LICENSE` file**:
  <https://api.github.com/repos/lyonsno/sf3d-webgpu/license> returns `404`.
- The bundled `@kaminos/webgpu-inference-kit@0.1.53` declares `"license": "UNLICENSED"`.
- `xatlas-web@0.1.0` declares `MIT`.
- Model weights are distributed as `BasinShapers/sf3d-webgpu-weights` under the **Stability AI
  Community License**: free for research, non-commercial, and commercial use by entities with
  annual revenue below US $1,000,000. See
  <https://huggingface.co/BasinShapers/sf3d-webgpu-weights/blob/main/LICENSE.md>.

Commercial release is therefore gated by written legal clearance for the unlicensed upstream
runtime plus a documented revenue-eligibility review for the weights. The feature remains disabled
unless a deployment explicitly sets `NEXT_PUBLIC_SF3D_ENABLED=true` and an approved weights URL.
Generated models are labelled as AI approximations and never described as measured 3D scans.
