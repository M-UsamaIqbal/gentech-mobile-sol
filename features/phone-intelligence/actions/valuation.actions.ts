'use server';

import { redirect } from 'next/navigation';
import { valuationService } from '../services/valuation.service';
import { phoneValuationSchema } from '../schemas/valuation.schema';

export async function calculateValuationAction(formData: FormData): Promise<void> {
  const input = phoneValuationSchema.parse({
    modelId: formData.get('modelId'),
    storage: formData.get('storage') || undefined,
    ram: formData.get('ram') || undefined,
    condition: formData.get('condition') || undefined,
    batteryHealth: formData.get('batteryHealth')
      ? parseInt(formData.get('batteryHealth') as string, 10)
      : undefined,
  });

  const isPreview = formData.get('isPreview') === 'true';

  const valuation = await valuationService.calculateValuation(input, isPreview);
  redirect(`/valuation?id=${valuation.id}`);
}

export async function getValuationAction(id: string) {
  const valuation = await valuationService.getValuation(id);
  return valuation;
}

export async function getMarketTrendAction(modelId: string) {
  const trend = await valuationService.getMarketTrend(modelId);
  return trend;
}
