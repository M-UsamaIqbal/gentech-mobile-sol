/**
 * Browser-only adapter for the vendored SF3D WebGPU producer.
 *
 * Nothing in this module runs on the server and no image is sent to GenTech or
 * an AI API. The producer module lives in `public/sf3d`; the multi-gigabyte
 * model weights are deliberately hosted outside the Vercel source bundle.
 */
import { MAX_MODEL_BYTES } from "@/lib/model-assets";

export const SF3D_PRODUCER_URL = "/sf3d/sf3d-producer.js";
export const SF3D_GENERATOR_ID = "SF3D_WEBGPU";

const configuredWeightsUrl = process.env.NEXT_PUBLIC_SF3D_WEIGHTS_URL?.trim();
const configuredEnabled = process.env.NEXT_PUBLIC_SF3D_ENABLED === "true";

/** Explicit opt-in prevents an accidental 2.1 GB download on every deployment. */
export const SF3D_GENERATION_ENABLED = Boolean(configuredEnabled && configuredWeightsUrl);
export const SF3D_WEIGHTS_URL = configuredWeightsUrl ?? "";

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normaliseETag(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return /^"[^"\r\n]+"$/.test(trimmed) ? trimmed : `"${trimmed.replace(/^"|"$/g, "")}"`;
}

export const SF3D_EXPECTED_WEIGHT_BYTES = parsePositiveInteger(
  process.env.NEXT_PUBLIC_SF3D_WEIGHTS_BYTES,
);
export const SF3D_EXPECTED_WEIGHT_ETAG = normaliseETag(
  process.env.NEXT_PUBLIC_SF3D_WEIGHTS_ETAG,
);

export interface Sf3dRunResult {
  glb: ArrayBuffer | ArrayBufferView;
  numVertices?: number;
  numFaces?: number;
  totalMs?: number;
  kitVersion?: string;
  identity?: { durationMs?: number; runId?: string };
  receiptValidation?: { ok?: boolean };
}

export interface Sf3dProducer {
  run(
    image: HTMLImageElement,
    options: { runId?: string; onProgress?: (message: string) => void },
  ): Promise<Sf3dRunResult>;
  dispose(): unknown;
  kitVersion?: string;
}

interface Sf3dProducerModule {
  createSf3dProducer(options: {
    weightsUrl: string;
    expectedWeightBytes?: number;
    expectedSourceETag?: string;
    weightLoadingMode: "whole-file";
    onWeightsProgress: (received: number, total: number) => void;
  }): Promise<Sf3dProducer>;
}

export interface Sf3dSession {
  run(image: HTMLImageElement, onProgress?: (message: string) => void): Promise<Sf3dRunResult>;
  dispose(): Promise<void>;
  kitVersion?: string;
}

type NavigatorWithWebGpu = Navigator & {
  gpu?: { requestAdapter: () => Promise<unknown | null> };
};

/** Fails closed when WebGPU is missing, disabled, or has no usable adapter. */
export async function isWebGpuAvailable(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const gpu = (navigator as NavigatorWithWebGpu).gpu;
  if (!gpu || typeof gpu.requestAdapter !== "function") return false;
  try {
    return Boolean(await gpu.requestAdapter());
  } catch {
    return false;
  }
}

/**
 * Verifies the externally hosted weight file before the producer streams it.
 * Both checks are optional so operators can choose their own immutable mirror.
 */
export async function verifyWeightsSource(signal?: AbortSignal): Promise<void> {
  if (!SF3D_WEIGHTS_URL) throw new Error("SF3D weights URL is not configured.");
  if (!SF3D_EXPECTED_WEIGHT_BYTES && !SF3D_EXPECTED_WEIGHT_ETAG) return;

  const response = await fetch(SF3D_WEIGHTS_URL, { method: "HEAD", cache: "no-store", signal });
  if (!response.ok) {
    throw new Error(`SF3D weights are unavailable (HTTP ${response.status}).`);
  }

  if (SF3D_EXPECTED_WEIGHT_BYTES) {
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 0 && contentLength !== SF3D_EXPECTED_WEIGHT_BYTES) {
      throw new Error("SF3D weights changed size. Generation is blocked until the mirror is reviewed.");
    }
  }

  if (SF3D_EXPECTED_WEIGHT_ETAG) {
    const responseETag = response.headers.get("etag");
    if (responseETag && normaliseETag(responseETag) !== SF3D_EXPECTED_WEIGHT_ETAG) {
      throw new Error("SF3D weights changed. Generation is blocked until the mirror is reviewed.");
    }
  }
}

async function importProducer(): Promise<Sf3dProducerModule> {
  // webpackIgnore keeps Next.js from trying to bundle a 760 KB browser module
  // that already carries its own worker chunks.
  const producerModule = (await import(
    /* webpackIgnore: true */ SF3D_PRODUCER_URL
  )) as Sf3dProducerModule;
  if (typeof producerModule.createSf3dProducer !== "function") {
    throw new Error("The SF3D browser module is unavailable.");
  }
  return producerModule;
}

/** Creates one producer. Keep it for regenerate so the 2.1 GB weights stay cached. */
export async function createSf3dSession(
  onWeightsProgress: (received: number, total: number) => void,
): Promise<Sf3dSession> {
  await verifyWeightsSource();
  const producerModule = await importProducer();
  const producer = await producerModule.createSf3dProducer({
    weightsUrl: SF3D_WEIGHTS_URL,
    expectedWeightBytes: SF3D_EXPECTED_WEIGHT_BYTES,
    expectedSourceETag: SF3D_EXPECTED_WEIGHT_ETAG,
    weightLoadingMode: "whole-file",
    onWeightsProgress,
  });

  let disposed = false;
  return {
    kitVersion: producer.kitVersion,
    async run(image, onProgress) {
      if (disposed) throw new Error("The SF3D session was already released.");
      const runId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `sf3d-${Date.now()}`;
      return producer.run(image, { runId, onProgress });
    },
    async dispose() {
      if (disposed) return;
      disposed = true;
      try {
        const result = await producer.dispose();
        const completion = (result as { completion?: unknown } | null)?.completion;
        if (completion && typeof (completion as Promise<unknown>).then === "function") {
          await completion;
        }
      } catch {
        // Resource release is best-effort; never mask the original run result.
      }
    },
  };
}

/** Decodes a Cloudinary (or local object) image without sending it anywhere. */
export async function loadSourceImage(url: string): Promise<HTMLImageElement> {
  if (!/^(https?:\/\/|blob:|data:image\/)/i.test(url)) {
    throw new Error("Choose a valid JPG, PNG or WebP photo.");
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(url)) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The source photo could not be decoded."));
    image.src = url;
  });
}

/** Creates the uploadable GLB and enforces the same cap as manual model uploads. */
export function createGlbFile(result: Sf3dRunResult, fileName: string): File {
  const view =
    result.glb instanceof ArrayBuffer
      ? new Uint8Array(result.glb)
      : new Uint8Array(result.glb.buffer, result.glb.byteOffset, result.glb.byteLength);
  const bytes = new ArrayBuffer(view.byteLength);
  new Uint8Array(bytes).set(view);
  if (bytes.byteLength === 0) throw new Error("SF3D produced an empty model.");
  if (bytes.byteLength > MAX_MODEL_BYTES) {
    throw new Error(`Generated model exceeds the ${MAX_MODEL_BYTES / 1024 / 1024} MB model limit.`);
  }
  return new File([bytes], fileName, { type: "model/gltf-binary" });
}
