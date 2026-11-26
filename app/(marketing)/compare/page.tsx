export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneComparisonTable } from '@/features/phone-intelligence/components/phone-comparison-table';
import { comparisonService } from '@/features/phone-intelligence/services/comparison.service';
import type { PhoneSpecComparison } from '@/features/phone-intelligence/schemas/comparison.schema';

export const metadata: Metadata = {
  title: 'Compare Phones - GenTech',
  description: 'Compare mobile phone specifications side by side. Make informed decisions with detailed specs for display, camera, battery, and more.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<{ phones?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const phoneIds = resolvedSearchParams.phones?.split(',').filter(Boolean) || [];

  let phones: PhoneSpecComparison[] = [];
  if (phoneIds.length >= 2) {
    phones = await comparisonService.getComparisonSpecs(phoneIds);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Phones</h1>
        <p className="text-gray-600">
          Compare mobile phone specifications side by side to make the best choice
        </p>
      </div>

      {phones.length >= 2 ? (
        <PhoneComparisonTable phones={phones} />
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Select Phones to Compare
          </h2>
          <p className="text-gray-600 mb-6">
            Choose at least 2 phones from the marketplace to compare their specifications
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
