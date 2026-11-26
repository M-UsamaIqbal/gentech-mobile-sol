import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ToastSpy = ReturnType<typeof vi.fn>;
type ToastMock = { success: ToastSpy; error: ToastSpy; info: ToastSpy };

const { toast } = vi.hoisted(() => {
  const scope = globalThis as typeof globalThis & { __gentechToastMock?: ToastMock };
  scope.__gentechToastMock ??= { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  return { toast: scope.__gentechToastMock };
});

const { mocks } = vi.hoisted(() => ({
  mocks: {
    isWebGpuAvailable: vi.fn(),
    createSf3dSession: vi.fn(),
    loadSourceImage: vi.fn(),
    createGlbFile: vi.fn(),
    run: vi.fn(),
    dispose: vi.fn(),
    weightsProgressCallback: vi.fn(),
    runProgressCallback: vi.fn(),
  },
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("@/features/listings/components/model-viewer", () => ({
  ModelViewer: () => <div data-model-viewer-stub>preview</div>,
}));
vi.mock("@/lib/sf3d", () => ({
  SF3D_GENERATION_ENABLED: true,
  SF3D_GENERATOR_ID: "SF3D_WEBGPU",
  isWebGpuAvailable: mocks.isWebGpuAvailable,
  createSf3dSession: mocks.createSf3dSession,
  loadSourceImage: mocks.loadSourceImage,
  createGlbFile: mocks.createGlbFile,
}));

import { ModelUploader } from "@/features/listings/components/model-uploader";
import type { UploadedImage, UploadedModel } from "@/features/listings/schemas/create-listing";

const signedUpload = {
  cloudName: "demo",
  apiKey: "key",
  timestamp: 123,
  folder: "models/user_1",
  signature: "signed",
  resourceType: "raw",
};

const sourceImages: UploadedImage[] = [
  {
    url: "https://res.cloudinary.com/demo/image/upload/v1/listings/user_1/phone.jpg",
    publicId: "listings/user_1/phone.jpg",
  },
];

const generatedModel: UploadedModel = {
  url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/sf3d.glb",
  publicId: "models/user_1/sf3d.glb",
  format: "GLB",
  sizeBytes: 8,
  assets: [],
  sourceType: "GENERATED",
  processingStatus: "READY",
  generator: "SF3D_WEBGPU",
};

class FakeXHR {
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  status = 200;
  responseText = JSON.stringify({
    secure_url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/sf3d.glb",
    public_id: "models/user_1/sf3d.glb",
    bytes: 8,
  });
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  open() {}
  send() {
    this.upload.onprogress?.({ lengthComputable: true, loaded: 8, total: 8 } as ProgressEvent);
    this.onload?.();
  }
}

beforeEach(() => {
  mocks.isWebGpuAvailable.mockResolvedValue(true);
  mocks.createGlbFile.mockReturnValue(new File(["12345678"], "sf3d.glb"));
  mocks.loadSourceImage.mockResolvedValue({} as HTMLImageElement);
  mocks.dispose.mockResolvedValue(undefined);
  mocks.run.mockImplementation(async (_image, options) => {
    mocks.runProgressCallback.mockImplementation(options.onProgress ?? (() => undefined));
    mocks.runProgressCallback("marching-tet stage");
    return {
      glb: new ArrayBuffer(8),
      numVertices: 120,
      numFaces: 240,
      kitVersion: "kit-1",
      identity: { runId: "run-1", durationMs: 1234 },
    };
  });
  mocks.createSf3dSession.mockImplementation(async (onWeightsProgress) => {
    mocks.weightsProgressCallback.mockImplementation(onWeightsProgress);
    mocks.weightsProgressCallback(1_024, 2_048);
    return { run: mocks.run, dispose: mocks.dispose, kitVersion: "kit-1" };
  });
  vi.stubGlobal("XMLHttpRequest", FakeXHR);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("browser SF3D generation", () => {
  it("shows a fallback when WebGPU is unavailable", async () => {
    mocks.isWebGpuAvailable.mockResolvedValue(false);
    render(<ModelUploader value={null} onChange={vi.fn()} sourceImages={sourceImages} />);

    await waitFor(() => expect(screen.getByText(/Browser generation is not available here/)).toBeTruthy());
    expect(screen.queryByLabelText("Upload GLB or GLTF model")).not.toBeNull();
  });

  it("explains that a source photo is required", async () => {
    render(<ModelUploader value={null} onChange={vi.fn()} sourceImages={[]} />);
    await waitFor(() => expect(screen.getByText(/Upload at least one JPG, PNG or WebP photo first/)).toBeTruthy());
  });

  it("generates, uploads and records AI provenance", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => signedUpload,
    });
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();

    render(<ModelUploader value={null} onChange={onChange} sourceImages={sourceImages} />);

    const generate = screen.getByRole("button", { name: "Generate 3D" });
    const licence = document.querySelector("[data-sf3d-licence-checkbox]") as HTMLInputElement;
    fireEvent.click(licence);
    await waitFor(() => expect(generate).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(generate);
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(mocks.createSf3dSession).toHaveBeenCalledTimes(1);
    expect(mocks.weightsProgressCallback).toHaveBeenCalledWith(1_024, 2_048);
    expect(mocks.run).toHaveBeenCalledTimes(1);
    expect(mocks.runProgressCallback).toHaveBeenCalledWith("marching-tet stage");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/uploads/sign-model", { method: "POST" });
    expect(onChange).toHaveBeenCalledWith({
      url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/sf3d.glb",
      publicId: "models/user_1/sf3d.glb",
      format: "GLB",
      sizeBytes: 8,
      assets: [],
      sourceType: "GENERATED",
      processingStatus: "READY",
      sourceImageUrl: sourceImages[0]!.url,
      sourceImagePublicId: sourceImages[0]!.publicId,
      generator: "SF3D_WEBGPU",
      generatorVersion: "kit-1",
      generationReceipt: { runId: "run-1", vertices: 120, faces: 240, durationMs: 1234 },
    });
    expect(toast.success).toHaveBeenCalledWith(
      "AI-generated 3D model ready. Preview it before saving.",
    );
  });

  it("refuses generation until the licence notice is accepted", async () => {
    render(<ModelUploader value={null} onChange={vi.fn()} sourceImages={sourceImages} />);
    const generate = screen.getByRole("button", { name: "Generate 3D" });
    await waitFor(() => expect(generate).toBeDisabled());
    expect(mocks.createSf3dSession).not.toHaveBeenCalled();
  });

  it("downloads a saved generated GLB", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["12345678"], { type: "model/gltf-binary" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.fn(() => "blob:sf3d-generated");
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("generated-model.glb");
        expect(this.href).toBe("blob:sf3d-generated");
      });

    render(
      <ModelUploader
        value={generatedModel}
        onChange={vi.fn()}
        sourceImages={sourceImages}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Download GLB" }));
    });
    expect(fetchMock).toHaveBeenCalledWith(generatedModel.url);
    expect(createObjectURL).toHaveBeenCalledTimes(1);

    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    anchorClick.mockRestore();
  });

  it("reuses the producer for regeneration and releases it on remove", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => signedUpload,
    });
    vi.stubGlobal("fetch", fetchMock);
    const onChange = vi.fn();

    const view = render(
      <ModelUploader value={generatedModel} onChange={onChange} sourceImages={sourceImages} />,
    );
    const regenerate = screen.getByRole("button", { name: "Regenerate 3D" });
    fireEvent.click(document.querySelector("[data-sf3d-licence-checkbox]") as HTMLInputElement);
    await waitFor(() => expect(regenerate).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(regenerate);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(regenerate).not.toBeDisabled());

    await act(async () => {
      fireEvent.click(regenerate);
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(mocks.createSf3dSession).toHaveBeenCalledTimes(1);
    expect(mocks.run).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    expect(onChange).toHaveBeenCalledWith(null);
    await waitFor(() => expect(mocks.dispose).toHaveBeenCalled());
    view.unmount();
  });
});
