'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { PhoneSpecComparison } from '../schemas/comparison.schema';

interface PhoneComparisonTableProps {
  phones: PhoneSpecComparison[];
  currency?: string;
  onRemove?: (id: string) => void;
  removeLabel?: string;
}

export function PhoneComparisonTable({
  phones,
  currency = 'PKR',
  onRemove,
  removeLabel = 'Remove from comparison',
}: PhoneComparisonTableProps) {
  if (phones.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No phones selected for comparison
      </div>
    );
  }

  const specSections = [
    {
      title: 'Display',
      specs: [
        { key: 'displaySize', label: 'Size' },
        { key: 'displayResolution', label: 'Resolution' },
        { key: 'displayType', label: 'Type' },
        { key: 'refreshRate', label: 'Refresh Rate' },
      ],
    },
    {
      title: 'Performance',
      specs: [
        { key: 'processor', label: 'Processor' },
        { key: 'cpuCores', label: 'CPU Cores' },
        { key: 'gpu', label: 'GPU' },
        { key: 'ramOptions', label: 'RAM Options' },
      ],
    },
    {
      title: 'Storage',
      specs: [
        { key: 'storageOptions', label: 'Storage Options' },
      ],
    },
    {
      title: 'Camera',
      specs: [
        { key: 'mainCamera', label: 'Main Camera' },
        { key: 'selfieCamera', label: 'Selfie Camera' },
        { key: 'cameraFeatures', label: 'Features' },
      ],
    },
    {
      title: 'Battery',
      specs: [
        { key: 'batteryCapacity', label: 'Capacity' },
        { key: 'batteryType', label: 'Type' },
        { key: 'chargingSpeed', label: 'Charging Speed' },
      ],
    },
    {
      title: 'Connectivity',
      specs: [
        { key: 'networkSupport', label: 'Network' },
        { key: 'simType', label: 'SIM Type' },
        { key: 'wifi', label: 'WiFi' },
        { key: 'bluetooth', label: 'Bluetooth' },
        { key: 'nfc', label: 'NFC' },
      ],
    },
    {
      title: 'Design',
      specs: [
        { key: 'weight', label: 'Weight' },
        { key: 'dimensions', label: 'Dimensions' },
        { key: 'colors', label: 'Colors' },
      ],
    },
    {
      title: 'Software',
      specs: [
        { key: 'os', label: 'OS' },
        { key: 'osVersion', label: 'Version' },
      ],
    },
    {
      title: 'Other',
      specs: [
        { key: 'features', label: 'Features' },
        { key: 'launchPrice', label: 'Launch Price' },
        { key: 'releaseDate', label: 'Release Date' },
      ],
    },
  ];

  const formatValue = (value: unknown, key: string): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (key === 'launchPrice' && typeof value === 'number') {
      return `${currency} ${value.toLocaleString()}`;
    }
    if (key === 'releaseDate' && (value instanceof Date || typeof value === 'string')) return new Date(value).toLocaleDateString();
    if (key === 'nfc') return value ? 'Yes' : 'No';
    if (key === 'cpuCores' && typeof value === 'number') return value.toString();
    return String(value);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b-2 border-gray-200 p-4 text-left font-semibold bg-gray-50 sticky left-0">
              Specification
            </th>
            {phones.map((phone) => (
              <th key={phone.id} className="border-b-2 border-gray-200 p-4 text-center font-semibold bg-gray-50 min-w-[200px]">
                <div className="relative flex flex-col items-center gap-2">
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(phone.id)}
                      aria-label={`${removeLabel}: ${phone.name}`}
                      title={removeLabel}
                      className="bg-background hover:bg-muted absolute -top-2 -end-2 rounded-full border p-1 shadow-sm"
                    >
                      <X className="text-muted-foreground size-3.5" />
                    </button>
                  ) : null}
                  {phone.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={phone.imageUrl}
                      alt={phone.name}
                      className="w-16 h-16 object-contain"
                    />
                  )}
                  <div>
                    <div className="text-sm text-gray-500">{phone.brand}</div>
                    <div className="font-medium">{phone.name}</div>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specSections.map((section) => (
            <React.Fragment key={section.title}>
              <tr className="bg-gray-50">
                <td colSpan={phones.length + 1} className="p-3 font-semibold text-sm">
                  {section.title}
                </td>
              </tr>
              {section.specs.map((spec) => (
                <tr key={spec.key} className="border-b border-gray-100">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50 sticky left-0">
                    {spec.label}
                  </td>
                  {phones.map((phone) => (
                    <td key={phone.id} className="p-4 text-center">
                      {formatValue(phone[spec.key as keyof PhoneSpecComparison], spec.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
