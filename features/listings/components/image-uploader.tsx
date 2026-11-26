"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, ImageOff, ImagePlus, Link2, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { isValidImageUrl, parseImageUrls } from "@/lib/validation/image-url";
import { MAX_LISTING_PHOTOS } from "@/features/listings/schemas/create-listing";
import type { UploadedImage } from "@/features/listings/schemas/create-listing";

interface Props {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
  /** Cloudinary folder to upload into (must be allowlisted server-side). */
  folder?: "listings" | "messages" | "inspections";
  /** Allow embedding a direct image link instead of uploading a file. */
  allowUrl?: boolean;
}

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  allowedFormats: string[];
}

export function ImageUploader({
  value,
  onChange,
  max = MAX_LISTING_PHOTOS,
  folder,
  allowUrl = false,
}: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [imageUrls, setImageUrls] = React.useState("");
  const [brokenUrls, setBrokenUrls] = React.useState<Set<string>>(() => new Set());
  const inputRef = React.useRef<HTMLInputElement>(null);
  const urlFieldId = React.useId();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${max} photos.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Only the first ${remaining} photo${remaining === 1 ? "" : "s"} can be added.`);
    }

    // Client-side validation for file types
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    const invalidFiles = selected.filter((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return !ext || !allowedExtensions.includes(ext);
    });

    if (invalidFiles.length > 0) {
      toast.error(`Only ${allowedExtensions.join(", ")} files are allowed.`);
      return;
    }

    setUploading(true);

    try {
      const uploadFolder = folder ?? "listings";
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ folder: uploadFolder }),
      });

      // Cloudinary not configured → dev-only local fallback (same as the quote flow),
      // so posting a listing with photos works without a Cloudinary account.
      const useLocal = signRes.status === 503;
      if (!useLocal && !signRes.ok) {
        const data = (await signRes.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Image uploads are not available right now.");
        return;
      }
      const sign = useLocal ? null : ((await signRes.json()) as SignResponse);

      const uploaded: UploadedImage[] = [];
      for (const file of selected) {
        if (useLocal) {
          const form = new FormData();
          form.append("file", file);
          form.append("folder", uploadFolder);
          const res = await fetch("/api/v1/uploads/local", { method: "POST", body: form });
          if (!res.ok) {
            toast.error(`Failed to upload ${file.name}`);
            continue;
          }
          const data = (await res.json()) as { secure_url: string; public_id: string };
          uploaded.push({ url: data.secure_url, publicId: data.public_id });
          continue;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("signature", sign.signature);
        form.append("folder", sign.folder);
        form.append("allowed_formats", sign.allowedFormats.join(","));
        form.append("resource_type", "image");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${sign!.cloudName}/auto/upload`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        const data = (await res.json()) as {
          secure_url: string;
          public_id: string;
          width?: number;
          height?: number;
        };
        uploaded.push({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        });
      }

      if (uploaded.length > 0) onChange([...value, ...uploaded]);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addFromUrls() {
    const candidates = parseImageUrls(imageUrls);
    if (candidates.length === 0) {
      toast.error("Enter at least one image URL.");
      return;
    }
    const invalid = candidates.filter((url) => !isValidImageUrl(url));
    if (invalid.length > 0) {
      toast.error(
        invalid.length === 1
          ? "One pasted link is not a valid https image URL."
          : `${invalid.length} pasted links are not valid https image URLs.`,
      );
      return;
    }
    const remaining = max - value.length;
    if (candidates.length > remaining) {
      toast.error(`You can add up to ${remaining} more photo${remaining === 1 ? "" : "s"}.`);
      return;
    }
    const existing = new Set(value.map((image) => image.url));
    if (
      candidates.some((url) => existing.has(url)) ||
      new Set(candidates).size !== candidates.length
    ) {
      toast.error("A pasted image is already added.");
      return;
    }

    onChange([...value, ...candidates.map((url) => ({ url }))]);
    setImageUrls("");
    setBrokenUrls((previous) => {
      const next = new Set(previous);
      candidates.forEach((url) => next.delete(url));
      return next;
    });
  }

  function setAsCover(index: number) {
    if (index === 0) return;
    const reordered = [...value];
    const [cover] = reordered.splice(index, 1);
    if (!cover) return;
    onChange([cover, ...reordered]);
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const reordered = [...value];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(target, 0, moved);
    onChange(reordered);
  }

  function markBroken(url: string) {
    setBrokenUrls((previous) => new Set(previous).add(url));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((image, index) => {
          const broken = brokenUrls.has(image.url);
          return (
            <div
              key={`${image.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              {broken ? (
                <div className="bg-muted text-muted-foreground flex h-full flex-col items-center justify-center gap-1 p-2 text-center text-xs">
                  <ImageOff className="size-5" />
                  Image failed to load
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt=""
                  onError={() => markBroken(image.url)}
                  className="h-full w-full object-cover"
                />
              )}
              {index === 0 ? (
                <span className="bg-primary text-primary-foreground absolute top-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium">
                  <Star className="size-2.5" /> Cover
                </span>
              ) : (
                <button
                  type="button"
                  aria-label="Set as cover"
                  onClick={() => setAsCover(index)}
                  className="bg-background/80 absolute bottom-1 left-1 grid size-6 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Star className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="bg-background/80 absolute top-1 right-1 grid size-6 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
              <div className="absolute right-1 bottom-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} left`}
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                  className="bg-background/80 grid size-6 place-items-center rounded-full disabled:opacity-40"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} right`}
                  disabled={index === value.length - 1}
                  onClick={() => moveImage(index, 1)}
                  className="bg-background/80 grid size-6 place-items-center rounded-full disabled:opacity-40"
                >
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {value.length < max ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "text-muted-foreground hover:border-primary/50 hover:text-foreground flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs transition-colors",
              uploading && "pointer-events-none opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="size-5" />
                Add photo
              </>
            )}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {allowUrl ? (
        <div className="mt-3 space-y-2">
          <label htmlFor={urlFieldId} className="flex items-center gap-1.5 text-sm font-medium">
            <Link2 className="size-4" /> Or paste image URLs
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id={urlFieldId}
              rows={2}
              inputMode="url"
              placeholder={"https://example.com/front.jpg\nhttps://example.com/back.jpg"}
              value={imageUrls}
              onChange={(event) => setImageUrls(event.target.value)}
              className="border-input bg-background focus-visible:ring-ring/50 min-h-20 min-w-0 flex-1 resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-3"
            />
            <button
              type="button"
              onClick={addFromUrls}
              disabled={!imageUrls.trim() || value.length >= max}
              className="border-input bg-background hover:bg-muted h-10 shrink-0 rounded-md border px-3 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
            >
              Add
            </button>
          </div>
          <p className="text-muted-foreground text-xs">
            Paste multiple direct https links, one per line or comma separated. JPG, PNG and WebP
            images only.
          </p>
        </div>
      ) : null}

      <p className="text-muted-foreground mt-2 text-xs">
        Up to {max} ordinary photos. The first photo is the cover; use the arrows to set the angle
        order. Buyers use that order to explore the product.
      </p>
    </div>
  );
}
