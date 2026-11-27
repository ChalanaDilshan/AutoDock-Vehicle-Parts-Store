import React, { useState, useEffect } from 'react';
import { CategoryItem, BrandItem, ProductCondition } from '../api/customerExperienceApi.js';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '../../../shared/components/index.js';

interface CatalogFilterSidebarProps {
  categories: CategoryItem[];
  brands: BrandItem[];
  selectedCategory?: string;
  selectedBrand?: string;
  selectedCondition?: ProductCondition;
  minPrice?: string;
  maxPrice?: string;
  onCategoryChange: (catSlug?: string) => void;
  onBrandChange: (brandSlug?: string) => void;
  onConditionChange: (condition?: ProductCondition) => void;
  onPriceChange: (min?: string, max?: string) => void;
  onResetFilters: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  selectedCondition,
  minPrice,
  maxPrice,
  onCategoryChange,
  onBrandChange,
  onConditionChange,
  onPriceChange,
  onResetFilters,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [localMin, setLocalMin] = useState(minPrice || '');
  const [localMax, setLocalMax] = useState(maxPrice || '');

  useEffect(() => {
    setLocalMin(minPrice || '');
    setLocalMax(maxPrice || '');
  }, [minPrice, maxPrice]);

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    onPriceChange(localMin.trim() || undefined, localMax.trim() || undefined);
  };

  const renderFilterSections = () => (
    <div className="divide-y divide-slate-200 text-sm">
      <div className="pb-4 flex items-center justify-between">
        <span className="font-semibold text-slate-900">Filters</span>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#E11D30] hover:text-[#BE123C]"
        >
          <RotateCcw className="w-3 h-3" aria-hidden="true" />
          <span>Reset all</span>
        </button>
      </div>

      {/* Category */}
      <div className="py-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Category
        </h3>
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5">
            <input
              type="radio"
              name="catalog-category"
              checked={!selectedCategory}
              onChange={() => onCategoryChange(undefined)}
              className="text-[#E11D30] border-slate-300 focus:ring-[#E11D30]"
            />
            <span>All Categories</span>
          </label>
          {categories.map((cat) => {
            const val = cat.slug || cat._id;
            const checked =
              selectedCategory === val || selectedCategory === cat._id;
            return (
              <label
                key={cat._id}
                className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5"
              >
                <input
                  type="radio"
                  name="catalog-category"
                  checked={checked}
                  onChange={() => onCategoryChange(val)}
                  className="text-[#E11D30] border-slate-300 focus:ring-[#E11D30]"
                />
                <span className="truncate">{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Brand */}
      <div className="py-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Brand
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5">
            <input
              type="radio"
              name="catalog-brand"
              checked={!selectedBrand}
              onChange={() => onBrandChange(undefined)}
              className="text-[#E11D30] border-slate-300 focus:ring-[#E11D30]"
            />
            <span>All Brands</span>
          </label>
          {brands.map((brand) => {
            const val = brand.slug || brand._id;
            const checked =
              selectedBrand === val || selectedBrand === brand._id;
            return (
              <label
                key={brand._id}
                className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5"
              >
                <input
                  type="radio"
                  name="catalog-brand"
                  checked={checked}
                  onChange={() => onBrandChange(val)}
                  className="text-[#E11D30] border-slate-300 focus:ring-[#E11D30]"
                />
                <span className="truncate">{brand.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Condition */}
      <div className="py-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Condition
        </h3>
        <div className="space-y-1.5">
          {(['NEW', 'RECONDITIONED', 'USED'] as ProductCondition[]).map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer py-0.5"
            >
              <input
                type="checkbox"
                checked={selectedCondition === cond}
                onChange={() =>
                  onConditionChange(selectedCondition === cond ? undefined : cond)
                }
                className="rounded text-[#E11D30] border-slate-300 focus:ring-[#E11D30]"
              />
              <span>
                {cond === 'NEW'
                  ? 'Brand New'
                  : cond === 'RECONDITIONED'
                    ? 'Reconditioned'
                    : 'Used'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <form onSubmit={applyPrice} className="pt-4 space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Price Range (LKR)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="Min"
            aria-label="Minimum price LKR"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E11D30] focus:outline-none"
          />
          <input
            type="number"
            min={0}
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Max"
            aria-label="Maximum price LKR"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E11D30] focus:outline-none"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" fullWidth>
          Apply Price
        </Button>
      </form>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="bg-white border border-slate-200 rounded-lg p-5 sticky top-24">
          {renderFilterSections()}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full z-10 flex flex-col border-r border-slate-200 shadow-md">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Filter Parts</span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close filters"
                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{renderFilterSections()}</div>
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <Button variant="primary" fullWidth onClick={onCloseMobile}>
                View Results
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
