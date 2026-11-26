import { z } from 'zod';

export const phoneValuationSchema = z.object({
  modelId: z.string().min(1, 'Select a phone model'),
  storage: z.string().optional(),
  ram: z.string().optional(),
  condition: z.enum(['NEW', 'OPEN_BOX', 'USED', 'REFURBISHED', 'FOR_PARTS']).optional(),
  batteryHealth: z.number().min(0).max(100).optional(),
});

export type PhoneValuationInput = z.infer<typeof phoneValuationSchema>;

export const phoneValuationResultSchema = z.object({
  id: z.string(),
  modelId: z.string(),
  modelName: z.string(),
  brandName: z.string(),
  storage: z.string().nullable(),
  ram: z.string().nullable(),
  condition: z.string().nullable(),
  batteryHealth: z.number().nullable(),
  estimatedPriceMin: z.number(),
  estimatedPriceMax: z.number(),
  estimatedPriceAvg: z.number(),
  currency: z.string().default('PKR'),
  sampleCount: z.number().nullable(),
  marketData: z.array(z.object({
    price: z.number(),
    condition: z.string(),
    city: z.string().nullable(),
    createdAt: z.coerce.date(),
  })).optional(),
  isPreview: z.boolean(),
  calculatedAt: z.date(),
});

export type PhoneValuationResult = z.infer<typeof phoneValuationResultSchema>;
