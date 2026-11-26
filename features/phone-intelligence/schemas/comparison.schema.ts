import { z } from 'zod';

export const phoneComparisonSchema = z.object({
  phoneIds: z.array(z.string()).min(2, 'Select at least 2 phones to compare').max(4, 'Maximum 4 phones can be compared'),
});

export type PhoneComparisonInput = z.infer<typeof phoneComparisonSchema>;

export const phoneSpecComparisonSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  slug: z.string(),
  imageUrl: z.string().optional(),
  displaySize: z.string().nullable(),
  displayResolution: z.string().nullable(),
  displayType: z.string().nullable(),
  refreshRate: z.string().nullable(),
  processor: z.string().nullable(),
  cpuCores: z.number().nullable(),
  gpu: z.string().nullable(),
  ramOptions: z.array(z.string()),
  storageOptions: z.array(z.string()),
  mainCamera: z.string().nullable(),
  selfieCamera: z.string().nullable(),
  cameraFeatures: z.array(z.string()),
  batteryCapacity: z.string().nullable(),
  batteryType: z.string().nullable(),
  chargingSpeed: z.string().nullable(),
  networkSupport: z.array(z.string()),
  simType: z.string().nullable(),
  wifi: z.string().nullable(),
  bluetooth: z.string().nullable(),
  nfc: z.boolean().nullable(),
  weight: z.string().nullable(),
  dimensions: z.string().nullable(),
  os: z.string().nullable(),
  osVersion: z.string().nullable(),
  features: z.array(z.string()),
  colors: z.array(z.string()),
  launchPrice: z.number().nullable(),
  releaseDate: z.date().nullable(),
});

export type PhoneSpecComparison = z.infer<typeof phoneSpecComparisonSchema>;
