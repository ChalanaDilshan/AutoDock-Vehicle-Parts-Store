import React from 'react';
import { ProductItem } from '../api/customerExperienceApi.js';

interface SpecsTableProps {
  product: ProductItem;
}

export const SpecsTable: React.FC<SpecsTableProps> = ({ product }) => {
  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : 'Generic OEM';

  const categoryName =
    typeof product.categoryId === 'object' && product.categoryId !== null
      ? product.categoryId.name
      : 'Auto Parts';

  const baseSpecs: Array<{ label: string; value?: string | number }> = [
    { label: 'SKU Number', value: product.sku },
    { label: 'Brand / Manufacturer', value: brandName },
    { label: 'Part Category', value: categoryName },
    { label: 'Condition', value: product.condition },
    { label: 'Manufacturer Part Number', value: product.partNumber || 'N/A' },
    { label: 'OEM Reference Number', value: product.oemNumber || 'N/A' },
    {
      label: 'Warranty',
      value: product.warrantyMonths ? `${product.warrantyMonths} Months` : 'Standard merchant warranty',
    },
    { label: 'Universal Fit', value: product.isUniversalFit ? 'Yes' : 'No' },
  ];

  const customSpecs = product.specifications
    ? Object.entries(product.specifications).map(([key, value]) => ({
        label: key,
        value,
      }))
    : [];

  const allSpecs = [...baseSpecs, ...customSpecs];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
        <h3 className="font-bold text-sm text-slate-900">Technical Specifications</h3>
      </div>
      <dl className="divide-y divide-slate-100">
        {allSpecs.map((spec, index) => (
          <div
            key={index}
            className={`px-5 py-2.5 grid grid-cols-2 text-xs ${
              index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
            }`}
          >
            <dt className="font-semibold text-slate-500">{spec.label}</dt>
            <dd className="text-slate-900 font-medium">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
