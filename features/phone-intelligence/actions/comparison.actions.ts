'use server';

import { comparisonService } from '../services/comparison.service';
import { phoneComparisonSchema } from '../schemas/comparison.schema';
import { getCurrentUser } from '@/lib/session';

export async function createComparisonAction(formData: FormData) {
  const user = await getCurrentUser();

  const phoneIds = formData.get('phoneIds') as string;
  const phoneIdsArray = JSON.parse(phoneIds);

  const input = phoneComparisonSchema.parse({
    phoneIds: phoneIdsArray,
  });

  const comparison = await comparisonService.createComparison(
    input,
    user?.id,
    user?.id ? undefined : formData.get('sessionId') as string
  );

  return comparison;
}

export async function getComparisonSpecsAction(phoneIds: string[]) {
  const specs = await comparisonService.getComparisonSpecs(phoneIds);
  return specs;
}

export async function getUserComparisonsAction() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const comparisons = await comparisonService.getUserComparisons(user.id);
  return comparisons;
}
