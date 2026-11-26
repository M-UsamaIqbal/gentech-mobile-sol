import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { errorToast } = vi.hoisted(() => ({ errorToast: vi.fn() }));

vi.mock("sonner", () => ({
  toast: { error: errorToast, success: vi.fn() },
}));

import { ImageUploader } from "@/features/listings/components/image-uploader";
import type { UploadedImage } from "@/features/listings/schemas/create-listing";

const firstUrl = "https://cdn.example.org/photos/front.webp";
const secondUrl = "https://cdn.example.org/photos/back.webp";
const urlField = () => screen.getByLabelText(/paste image URLs/i);

function renderUploader(
  value: UploadedImage[] = [],
  onChange = vi.fn(),
  allowUrl = true,
  max = 10,
) {
  const view = render(
    <ImageUploader value={value} onChange={onChange} allowUrl={allowUrl} max={max} />,
  );
  return { onChange, ...view };
}

afterEach(() => {
  vi.unstubAllGlobals();
  errorToast.mockClear();
});

describe("listing image uploader", () => {
  it("adds several pasted https URLs in one action", () => {
    const existing: UploadedImage[] = [
      {
        url: "https://res.cloudinary.com/gentech/image/upload/listings/phone.jpg",
        publicId: "listings/phone",
      },
    ];
    const { onChange } = renderUploader(existing);

    fireEvent.change(urlField(), {
      target: { value: `${firstUrl}\n${secondUrl}` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith([...existing, { url: firstUrl }, { url: secondUrl }]);
    expect(urlField()).toHaveValue("");
  });

  it("rejects a batch containing an unsafe URL without changing the image list", () => {
    const { onChange } = renderUploader();

    fireEvent.change(urlField(), {
      target: { value: `${firstUrl}\nhttp://localhost/phone.jpg` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(errorToast).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects duplicate URLs", () => {
    const { onChange } = renderUploader([{ url: firstUrl }]);
    fireEvent.change(urlField(), { target: { value: firstUrl } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects a batch exceeding the remaining photo limit", () => {
    const { onChange } = renderUploader([{ url: firstUrl }], vi.fn(), true, 2);
    fireEvent.change(urlField(), {
      target: { value: `${secondUrl}\nhttps://example.com/third.jpg` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uploads multiple selected files as separate images", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cloudName: "demo",
          apiKey: "key",
          timestamp: 1,
          folder: "listings",
          signature: "sig",
          allowedFormats: ["jpg", "jpeg", "png", "webp"],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: firstUrl, public_id: "listings/one" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: secondUrl, public_id: "listings/two" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { onChange, container } = renderUploader();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput!, {
      target: {
        files: [
          new File(["a"], "front.jpg", { type: "image/jpeg" }),
          new File(["b"], "back.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([
        { url: firstUrl, publicId: "listings/one", width: undefined, height: undefined },
        { url: secondUrl, publicId: "listings/two", width: undefined, height: undefined },
      ]),
    );
  });

  it("lets a seller promote an added URL image to the cover", () => {
    const images: UploadedImage[] = [
      { url: "https://res.cloudinary.com/gentech/image/upload/a.jpg" },
      { url: firstUrl },
    ];
    const { onChange } = renderUploader(images);

    fireEvent.click(screen.getByRole("button", { name: "Set as cover" }));

    expect(onChange).toHaveBeenCalledWith([...images].reverse());
  });

  it("lets a seller reorder ordinary photos into angle sequence", () => {
    const images: UploadedImage[] = [
      { url: "https://res.cloudinary.com/gentech/image/upload/a.jpg" },
      { url: firstUrl },
      { url: secondUrl },
    ];
    const { onChange } = renderUploader(images);

    fireEvent.click(screen.getByRole("button", { name: "Move photo 2 left" }));

    expect(onChange).toHaveBeenCalledWith([images[1], images[0], images[2]]);
  });

  it("keeps URL entry out of non-listing uploaders", () => {
    renderUploader([], vi.fn(), false);
    expect(screen.queryByLabelText(/paste image URLs/i)).not.toBeInTheDocument();
  });
});
