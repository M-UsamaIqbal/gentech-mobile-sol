import { z } from "zod";

export const CONDITION_VALUES = ["NEW", "OPEN_BOX", "USED", "REFURBISHED", "FOR_PARTS"] as const;

export const uploadedImageSchema = z.object({
  // Absolute URL (Cloudinary) or a root-relative local-upload path (dev fallback).
  url: z
    .string()
    .min(1)
    .refine((v) => /^https?:\/\//i.test(v) || v.startsWith("/"), "Enter a valid image URL."),
  publicId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type UploadedImage = z.infer<typeof uploadedImageSchema>;

export const createListingSchema = z.object({
  title: z.string().trim().min(5, "Title is too short").max(120),
  description: z.string().trim().min(20, "Add a bit more detail").max(4000),
  price: z
    .number({ message: "Enter a valid price" })
    .positive("Price must be greater than 0")
    .max(100_000_000),
  condition: z.enum(CONDITION_VALUES, { message: "Select a condition" }),
  categorySlug: z.string().min(1, "Select a category"),
  brandSlug: z.string().optional(),
  city: z.string().min(1, "Select a city"),
  area: z.string().trim().max(120).optional(),
  negotiable: z.boolean().optional(),

  // Phone-specific attributes (all optional).
  storage: z.string().trim().max(40).optional(),
  ram: z.string().trim().max(40).optional(),
  color: z.string().trim().max(40).optional(),
  batteryHealth: z
    .string()
    .regex(/^\d{1,3}$/, "Enter a number 0–100")
    .optional()
    .or(z.literal("")),
  ptaApproved: z.boolean().optional(),

  images: z.array(uploadedImageSchema).min(1, "Add at least one photo").max(10),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
