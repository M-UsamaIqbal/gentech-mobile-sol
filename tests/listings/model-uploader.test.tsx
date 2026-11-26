import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

type ToastSpy = ReturnType<typeof vi.fn>;
type ToastMock = { success: ToastSpy; error: ToastSpy; info: ToastSpy };

const { toast } = vi.hoisted(() => {
  const scope = globalThis as typeof globalThis & { __gentechToastMock?: ToastMock };
  scope.__gentechToastMock ??= { success: vi.fn(), error: vi.fn(), info: vi.fn() };
  return { toast: scope.__gentechToastMock };
});

vi.mock("sonner", () => ({ toast }));

vi.mock("@/features/listings/components/model-viewer", () => ({
  ModelViewer: () => <div data-model-viewer-stub>preview</div>,
}));

import { ModelUploader } from "@/features/listings/components/model-uploader";
import type { UploadedModel } from "@/features/listings/schemas/create-listing";

const signedUpload = {
  cloudName: "demo",
  apiKey: "key",
  timestamp: 123,
  folder: "models/user_1",
  signature: "signed",
  resourceType: "raw",
};

class FakeXHR {
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  status = 200;
  responseText = JSON.stringify({
    secure_url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/phone.glb",
    public_id: "models/user_1/phone.glb",
    bytes: 3,
  });
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  open() {}
  send() {
    this.upload.onprogress?.({ lengthComputable: true, loaded: 3, total: 3 } as ProgressEvent);
    this.onload?.();
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("optional 3D model uploader", () => {
  it("uploads a genuine GLB through the signed raw endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => signedUpload,
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("XMLHttpRequest", FakeXHR);
    const onChange = vi.fn();

    render(<ModelUploader value={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Upload GLB or GLTF model"), {
      target: { files: [new File(["123"], "phone.glb")] },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/uploads/sign-model", { method: "POST" });
    expect(onChange).toHaveBeenCalledWith({
      url: "https://res.cloudinary.com/demo/raw/upload/v1/models/user_1/phone.glb",
      publicId: "models/user_1/phone.glb",
      format: "GLB",
      sizeBytes: 3,
      assets: [],
      sourceType: "UPLOADED",
      processingStatus: "READY",
    });
  });

  it("rejects unsupported model files before requesting a signature", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<ModelUploader value={null} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Upload GLB or GLTF model"), {
      target: { files: [new File(["zip"], "phone.zip")] },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Only .glb and .gltf files are supported.");
  });

  it("previews and removes an uploaded model", async () => {
    const model: UploadedModel = {
      url: signedUpload.folder + "/phone.glb",
      publicId: "models/user_1/phone.glb",
      format: "GLB",
      sizeBytes: 3,
      assets: [],
    };
    const onChange = vi.fn();
    render(<ModelUploader value={model} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Preview 3D" }));
    await waitFor(() => expect(document.querySelector("[data-model-viewer-stub]")).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
