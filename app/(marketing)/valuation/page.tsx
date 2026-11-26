export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneValuationCard } from '@/features/phone-intelligence/components/phone-valuation-card';
import { phoneModelRepository } from '@/features/phone-intelligence/repositories/phone-model.repository';
import { valuationService } from '@/features/phone-intelligence/services/valuation.service';
import { calculateValuationAction } from '@/features/phone-intelligence/actions/valuation.actions';

export const metadata: Metadata = {
  title: 'Phone Valuation - GenTech',
  description: 'Check the market value of your phone. Get instant price estimates based on current listings and market trends.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ValuationPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const [phoneModels, valuation] = await Promise.all([
    phoneModelRepository.findAllActive(),
    resolvedSearchParams.id
      ? valuationService.getValuation(resolvedSearchParams.id)
      : null,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Valuation</h1>
        <p className="text-gray-600">
          Get an instant market value estimate for your phone based on current listings
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Valuation Form */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Calculate Value</h2>
          <form action={calculateValuationAction} className="space-y-4">
            <div>
              <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Model
              </label>
              <select
                id="modelId"
                name="modelId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a model</option>
                {phoneModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brand.name} {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="storage" className="block text-sm font-medium text-gray-700 mb-1">
                  Storage
                </label>
                <select
                  id="storage"
                  name="storage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>

              <div>
                <label htmlFor="ram" className="block text-sm font-medium text-gray-700 mb-1">
                  RAM
                </label>
                <select
                  id="ram"
                  name="ram"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Any</option>
                  <option value="4GB">4GB</option>
                  <option value="6GB">6GB</option>
                  <option value="8GB">8GB</option>
                  <option value="12GB">12GB</option>
                  <option value="16GB">16GB</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                Condition
              </label>
              <select
                id="condition"
                name="condition"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any</option>
                <option value="NEW">New</option>
                <option value="OPEN_BOX">Open Box</option>
                <option value="USED">Used</option>
                <option value="REFURBISHED">Refurbished</option>
                <option value="FOR_PARTS">For Parts</option>
              </select>
            </div>

            <div>
              <label htmlFor="batteryHealth" className="block text-sm font-medium text-gray-700 mb-1">
                Battery Health (%)
              </label>
              <input
                type="number"
                id="batteryHealth"
                name="batteryHealth"
                min="0"
                max="100"
                placeholder="e.g., 85"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <input type="hidden" name="isPreview" value="true" />

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Calculate Value
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {valuation && <PhoneValuationCard valuation={valuation} />}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• We analyze current active listings for your phone model</li>
              <li>• Prices are adjusted based on condition, storage, and battery health</li>
              <li>• Get a realistic market range before listing your phone</li>
              <li>• Use the estimate to set a competitive price</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Sell Your Phone</h3>
            <p className="text-sm text-yellow-800 mb-3">
              Once you have your valuation, you can create a listing with just a few clicks.
            </p>
            <Link
              href="/dashboard/listings/create"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Create Listing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
