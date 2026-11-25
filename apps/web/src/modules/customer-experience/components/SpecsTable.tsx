import React from 'react';
import { ProductItem } from '../api/customerExperienceApi.js';

interface SpecsTableProps {
  product: ProductItem;
}

export const SpecsTable: React.FC<SpecsTableProps> = ({ product }) => {
  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : 'OEM / Generic';

  const categoryName =
    typeof product.categoryId === 'object' && product.categoryId !== null
      ? product.categoryId.name
      : 'Auto Parts';

  const baseSpecs: Array<{ label: string; value?: string | number }> = [
    { label: 'SKU Number', value: product.sku },
    { label: 'Part Number', value: product.partNumber },
    { label: 'OEM Number', value: product.oemNumber },
    { label: 'Manufacturer / Brand', value: brandName },
    { label: 'Part Category', value: categoryName },
    { label: 'Condition', value: product.condition },
    {
      label: 'Warranty',
      value: product.warrantyMonths ? `${product.warrantyMonths} months` : undefined,
    },
  ];

  const customSpecs = Object.entries(product.specifications || {}).map(
    ([label, value]) => ({ label, value })
  );

  const allSpecs = [...baseSpecs, ...customSpecs].filter(
    (row) => row.value !== undefined && row.value !== ''
  );

  return (
    <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-semibold text-slate-900">
          Technical Specifications
        </h2>
      </div>
      <dl className="divide-y divide-slate-200 text-sm">
        {allSpecs.map((spec) => (
          <div
            key={spec.label}
            className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-3"
          >
            <dt className="text-slate-500 font-medium">{spec.label}</dt>
            <dd className="sm:col-span-2 text-slate-900 font-medium break-words">
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};
