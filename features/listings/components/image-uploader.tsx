"use client";

import * as React from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import type { UploadedImage } from "@/features/listings/schemas/create-listing";

interface Props {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;
  /** Cloudinary folder to upload into (must be allowlisted server-side). */
  folder?: "listings" | "messages" | "inspections";
}

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function ImageUploader({ value, onChange, max = 10, folder }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${max} photos.`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const signRes = await fetch("/api/v1/uploads/sign", {
        method: "POST",
        ...(folder
          ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ folder }) }
          : {}),
      });
      if (!signRes.ok) {
        const data = (await signRes.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Image uploads are not available right now.");
        return;
      }
      const sign = (await signRes.json()) as SignResponse;

      const uploaded: UploadedImage[] = [];
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sign.apiKey);
        form.append("timestamp", String(sign.timestamp));
        form.append("signature", sign.signature);
        form.append("folder", sign.folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`, {
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

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((image, index) => (
          <div
            key={image.url}
            className="group relative aspect-square overflow-hidden rounded-lg border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            {index === 0 ? (
              <span className="bg-primary text-primary-foreground absolute top-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                <Star className="size-2.5" /> Cover
              </span>
            ) : null}
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => remove(index)}
              className="bg-background/80 absolute top-1 right-1 grid size-6 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

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
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-muted-foreground mt-2 text-xs">
        Up to {max} photos. The first photo is the cover.
      </p>
    </div>
  );
}
