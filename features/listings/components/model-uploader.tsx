"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Box,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  ASSET_EXTENSIONS,
  MAX_ASSET_BYTES,
  MAX_MODEL_ASSETS,
  MAX_MODEL_BYTES,
  MAX_MODEL_TOTAL_BYTES,
  fileExtension,
  isSafeAssetName,
  isSupportedAssetName,
  missingAssetUris,
  modelFormatFromName,
  referencedAssetUris,
} from "@/lib/model-assets";
import {
  SF3D_GENERATION_ENABLED,
  SF3D_GENERATOR_ID,
  createGlbFile,
  createSf3dSession,
  isWebGpuAvailable,
  loadSourceImage,
  type Sf3dSession,
} from "@/lib/sf3d";
import type {
  UploadedImage,
  UploadedModel,
  UploadedModelAsset,
} from "@/features/listings/schemas/create-listing";

const ModelViewer = dynamic(
  () => import("./model-viewer").then((module) => module.ModelViewer),
  { ssr: false, loading: () => <p className="text-muted-foreground p-4 text-sm">Loading 3D viewer…</p> },
);

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  resourceType: "raw";
}

interface UploadedRawFile {
  secure_url: string;
  public_id: string;
  bytes?: number;
}

type GenerationPhase =
  | "checking"
  | "unavailable"
  | "ready"
  | "weights"
  | "generating"
  | "uploading";

function progressFromRunMessage(message: string): number {
  const stages = [
    "preprocess",
    "tokenizer",
    "backbone",
    "triplane",
    "marching",
    "texture",
    "glb",
  ];
  const normalized = message.toLowerCase();
  const index = stages.findIndex((stage) => normalized.includes(stage));
  return index < 0 ? 40 : 35 + index * 8;
}

async function requestSignature(): Promise<SignResponse> {
  const response = await fetch("/api/v1/uploads/sign-model", { method: "POST" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "3D uploads are not available right now.");
  }
  return (await response.json()) as SignResponse;
}

function uploadRawFile(
  file: File,
  sign: SignResponse,
  onProgress: (percent: number) => void,
): Promise<UploadedRawFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);
    form.append("resource_type", "raw");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/raw/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      const status = xhr.status;
      let data: UploadedRawFile | null = null;
      try {
        data = JSON.parse(xhr.responseText) as UploadedRawFile;
      } catch {
        data = null;
      }
      if (status >= 200 && status < 300 && data?.secure_url && data.public_id) {
        resolve(data);
      } else {
        reject(new Error(`Could not upload ${file.name}.`));
      }
    };
    xhr.onerror = () => reject(new Error(`Could not upload ${file.name}.`));
    xhr.send(form);
  });
}

/** Optional 3D model controls for sellers: manual GLB/GLTF upload or browser SF3D generation. */
export function ModelUploader({
  value,
  onChange,
  sourceImages = [],
}: {
  value: UploadedModel | null;
  onChange: (model: UploadedModel | null) => void;
  sourceImages?: UploadedImage[];
}) {
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [requiredUris, setRequiredUris] = React.useState<string[]>([]);
  const [preview, setPreview] = React.useState(false);
  const [phase, setPhase] = React.useState<GenerationPhase>(
    SF3D_GENERATION_ENABLED ? "checking" : "unavailable",
  );
  const [generationMessage, setGenerationMessage] = React.useState("");
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [sourceUrl, setSourceUrl] = React.useState<string | null>(null);
  const [licenceAccepted, setLicenceAccepted] = React.useState(false);
  const [localGlb, setLocalGlb] = React.useState<File | null>(null);
  const modelInput = React.useRef<HTMLInputElement>(null);
  const assetInput = React.useRef<HTMLInputElement>(null);
  const sessionRef = React.useRef<Sf3dSession | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!SF3D_GENERATION_ENABLED) return;
    let cancelled = false;
    void isWebGpuAvailable().then((available) => {
      if (cancelled) return;
      setPhase(available ? "ready" : "unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSourceUrl =
    sourceUrl && sourceImages.some((image) => image.url === sourceUrl)
      ? sourceUrl
      : (sourceImages[0]?.url ?? "");

  React.useEffect(
    () => () => {
      void sessionRef.current?.dispose();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  async function handleModel(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const format = modelFormatFromName(file.name);
    if (!format) {
      toast.error("Only .glb and .gltf files are supported.");
      return;
    }
    if (!isSafeAssetName(file.name)) {
      toast.error("Use a simple model file name (letters, numbers, dots and dashes).");
      return;
    }
    if (file.size > MAX_MODEL_BYTES) {
      toast.error(`3D models must be under ${MAX_MODEL_BYTES / 1024 / 1024} MB.`);
      return;
    }

    let uris: string[] = [];
    if (format === "GLTF") {
      try {
        uris = referencedAssetUris(await file.text());
      } catch {
        toast.error("The .gltf file could not be read.");
        return;
      }
      if (uris.length === 0) {
        setRequiredUris([]);
      } else {
        setRequiredUris(uris);
        toast.info("Select the .bin and texture files referenced by this .gltf model.");
        return;
      }
    } else {
      setRequiredUris([]);
    }

    await uploadModel(file, format, []);
  }

  async function handleAssets(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;
    const invalid = selected.find((file) => !isSupportedAssetName(file.name));
    if (invalid) {
      toast.error(`Unsupported asset ${invalid.name}. Use .bin or image textures.`);
      return;
    }
    if (selected.length > MAX_MODEL_ASSETS) {
      toast.error(`A model can have at most ${MAX_MODEL_ASSETS} supporting assets.`);
      return;
    }
    if (selected.some((file) => file.size > MAX_ASSET_BYTES)) {
      toast.error(`Each model asset must be under ${MAX_ASSET_BYTES / 1024 / 1024} MB.`);
      return;
    }
    const missing = missingAssetUris(
      requiredUris,
      selected.map((file) => file.name),
    );
    if (missing.length > 0) {
      toast.error(`Missing supporting files: ${missing.join(", ")}`);
      return;
    }

    const input = modelInput.current?.files?.[0];
    if (!input) {
      toast.error("Choose the .gltf model file first.");
      return;
    }
    const format = modelFormatFromName(input.name);
    if (!format || fileExtension(input.name) !== "gltf") {
      toast.error("Supporting assets are only needed for .gltf models.");
      return;
    }
    await uploadModel(input, format, selected);
  }

  async function uploadModel(file: File, format: UploadedModel["format"], assets: File[]) {
    const totalBytes = file.size + assets.reduce((sum, asset) => sum + asset.size, 0);
    if (totalBytes > MAX_MODEL_TOTAL_BYTES) {
      toast.error("The model and its assets are too large.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const sign = await requestSignature();
      const modelUpload = await uploadRawFile(file, sign, (percent) => setProgress(percent));
      const uploadedAssets: UploadedModelAsset[] = [];
      for (const [index, asset] of assets.entries()) {
        const result = await uploadRawFile(asset, sign, (percent) => {
          setProgress(Math.round(((index + percent / 100) / (assets.length + 1)) * 100));
        });
        const uri = requiredUris.find((required) => required.endsWith(asset.name)) ?? asset.name;
        uploadedAssets.push({
          uri,
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes ?? asset.size,
        });
      }

      onChange({
        url: modelUpload.secure_url,
        publicId: modelUpload.public_id,
        format,
        sizeBytes: modelUpload.bytes ?? file.size,
        assets: uploadedAssets,
        sourceType: "UPLOADED",
        processingStatus: "READY",
      });
      setLocalGlb(null);
      setPreview(false);
      toast.success("3D model uploaded. You can preview it before publishing.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "3D upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (modelInput.current) modelInput.current.value = "";
      if (assetInput.current) assetInput.current.value = "";
    }
  }

  async function generate() {
    const source =
      sourceImages.find((image) => image.url === selectedSourceUrl) ?? sourceImages[0];
    if (!source) {
      toast.error("Upload a JPG, PNG or WebP photo first.");
      return;
    }
    if (!licenceAccepted) {
      toast.error("Confirm the SF3D licence conditions before generating.");
      return;
    }
    if (phase !== "ready") {
      toast.error("Browser 3D generation is unavailable on this device.");
      return;
    }

    setGenerationMessage("Preparing browser generation…");
    setGenerationProgress(0);
    try {
      if (!sessionRef.current) {
        setPhase("weights");
        sessionRef.current = await createSf3dSession((received, total) => {
          if (total > 0) setGenerationProgress(Math.min(30, Math.round((received / total) * 30)));
        });
      }

      setPhase("generating");
      setGenerationProgress(32);
      const image = await loadSourceImage(source.url);
      const result = await sessionRef.current.run(image, (message) => {
        setGenerationMessage(message);
        setGenerationProgress(progressFromRunMessage(message));
      });
      const glbFile = createGlbFile(result, `sf3d-${Date.now()}.glb`);
      setLocalGlb(glbFile);

      setPhase("uploading");
      const sign = await requestSignature();
      const upload = await uploadRawFile(glbFile, sign, (percent) => {
        setGenerationProgress(85 + Math.round(percent * 0.15));
      });

      onChange({
        url: upload.secure_url,
        publicId: upload.public_id,
        format: "GLB",
        sizeBytes: upload.bytes ?? glbFile.size,
        assets: [],
        sourceType: "GENERATED",
        processingStatus: "READY",
        sourceImageUrl: source.url,
        sourceImagePublicId: source.publicId,
        generator: SF3D_GENERATOR_ID,
        generatorVersion: result.kitVersion ?? sessionRef.current.kitVersion,
        generationReceipt: {
          runId: result.identity?.runId,
          vertices: result.numVertices,
          faces: result.numFaces,
          durationMs: result.identity?.durationMs ?? result.totalMs,
        },
      });
      setPreview(false);
      toast.success("AI-generated 3D model ready. Preview it before saving.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "3D generation failed.");
    } finally {
      setPhase("ready");
      setGenerationProgress(0);
      setGenerationMessage("");
    }
  }

  async function downloadGenerated() {
    try {
      let file = localGlb;
      if (!file && value) {
        const response = await fetch(value.url);
        if (!response.ok) throw new Error("The generated GLB could not be downloaded.");
        file = new File([await response.blob()], "generated-model.glb", {
          type: "model/gltf-binary",
        });
      }
      if (!file) return;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "generated-model.glb";
      anchor.click();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed.");
    }
  }

  function releaseGenerationResources() {
    void sessionRef.current?.dispose();
    sessionRef.current = null;
    setLocalGlb(null);
  }

  function remove() {
    releaseGenerationResources();
    onChange(null);
    setRequiredUris([]);
    setPreview(false);
  }

  const isGenerated = value?.sourceType === "GENERATED";
  const generationBusy = phase === "weights" || phase === "generating" || phase === "uploading";

  return (
    <div className="space-y-3 rounded-xl border border-dashed p-4" data-sf3d-panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">3D model (optional)</p>
          <p className="text-muted-foreground text-xs">
            Upload a genuine GLB/GLTF, or generate an AI approximation from one of your photos.
          </p>
        </div>
        <Box className="text-brand size-5 shrink-0" />
      </div>

      <input
        ref={modelInput}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
        onChange={(event) => void handleModel(event.target.files)}
        className="text-muted-foreground w-full text-xs"
        aria-label="Upload GLB or GLTF model"
      />

      {requiredUris.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium">Supporting assets for this .gltf:</p>
          <p className="text-muted-foreground break-all text-xs">{requiredUris.join(", ")}</p>
          <input
            ref={assetInput}
            type="file"
            multiple
            accept={ASSET_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
            onChange={(event) => void handleAssets(event.target.files)}
            className="text-muted-foreground w-full text-xs"
            aria-label="Upload GLTF supporting assets"
          />
        </div>
      ) : null}

      {uploading ? (
        <div className="space-y-1" data-model-upload-progress>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-brand h-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Loader2 className="size-3 animate-spin" /> Uploading {progress}%
          </p>
        </div>
      ) : null}

      <div className="space-y-2 rounded-lg border p-3" data-sf3d-generation>
        <div className="flex items-start gap-2">
          <Sparkles className="text-brand mt-0.5 size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium">Generate 3D from a photo</p>
            <p className="text-muted-foreground text-xs">
              Runs entirely in this browser with WebGPU. First use downloads about 2.1 GB of model
              weights; results are AI approximations, not measured scans.
            </p>
          </div>
        </div>

        {phase === "unavailable" ? (
          <p
            className="text-muted-foreground flex items-start gap-1.5 text-xs"
            data-sf3d-fallback
          >
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
            Browser generation is not available here. Use a WebGPU-capable browser, or upload your
            own GLB/GLTF above.
          </p>
        ) : null}

        {SF3D_GENERATION_ENABLED && sourceImages.length > 0 ? (
          <div className="grid gap-2">
            <label className="grid gap-1 text-xs" htmlFor="sf3d-source-image">
              Source photo
              <select
                id="sf3d-source-image"
                value={selectedSourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                className="bg-background h-9 rounded-md border px-2 text-xs"
                disabled={generationBusy}
                data-sf3d-source-select
              >
                {sourceImages.map((image, index) => (
                  <option key={`${image.url}-${index}`} value={image.url}>
                    Photo {index + 1}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-start gap-2 text-xs">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={licenceAccepted}
                onChange={(event) => setLicenceAccepted(event.target.checked)}
                disabled={generationBusy}
                data-sf3d-licence-checkbox
              />
              <span className="text-muted-foreground">
                I confirm this use complies with the SF3D runtime and Stability AI model licences.
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void generate()}
                disabled={phase !== "ready" || !licenceAccepted || generationBusy}
                className="border-brand text-brand flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-brand-soft disabled:opacity-50"
                data-sf3d-generate
              >
                {value?.sourceType === "GENERATED" ? (
                  <RefreshCw className="size-3.5" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {value?.sourceType === "GENERATED" ? "Regenerate 3D" : "Generate 3D"}
              </button>
              {value && (isGenerated || localGlb) ? (
                <button
                  type="button"
                  onClick={() => void downloadGenerated()}
                  className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors hover:border-brand"
                  data-sf3d-download
                >
                  <Download className="size-3.5" /> Download GLB
                </button>
              ) : null}
            </div>

            {phase === "checking" ? (
              <p className="text-muted-foreground text-xs" data-sf3d-status="checking">
                Checking WebGPU support…
              </p>
            ) : null}

            {generationBusy ? (
              <div className="space-y-1" data-sf3d-status={phase} data-sf3d-progress>
                <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full transition-[width] duration-200"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {phase === "weights"
                    ? `Loading generation weights ${generationProgress}%`
                    : phase === "uploading"
                      ? `Uploading generated model ${generationProgress}%`
                      : generationMessage || "Generating 3D model…"}
                </p>
              </div>
            ) : null}
          </div>
        ) : SF3D_GENERATION_ENABLED ? (
          <p className="text-muted-foreground text-xs" data-sf3d-no-source>
            Upload at least one JPG, PNG or WebP photo first, then generate from it.
          </p>
        ) : null}
      </div>

      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-brand-soft text-brand flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <CheckCircle2 className="size-3.5" />
            {isGenerated ? "AI-generated GLB ready" : `${value.format} model ready`}
          </span>
          <button
            type="button"
            onClick={() => setPreview((previous) => !previous)}
            className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-brand"
          >
            {preview ? "Hide preview" : "Preview 3D"}
          </button>
          <button
            type="button"
            onClick={remove}
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs",
              "transition-colors hover:border-destructive hover:text-destructive",
            )}
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      ) : (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <UploadCloud className="size-3.5" /> Optional enhancement — not shown to buyers until you add one.
        </p>
      )}

      {value && preview ? (
        <div className="bg-muted h-72 overflow-hidden rounded-lg border" data-model-preview>
          <ModelViewer model={value} title="3D model preview" />
        </div>
      ) : null}
    </div>
  );
}
