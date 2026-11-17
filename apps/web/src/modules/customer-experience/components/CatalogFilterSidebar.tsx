import React from 'react';
import { CategoryItem, BrandItem, ProductCondition } from '../api/customerExperienceApi.js';
import { X, RotateCcw } from 'lucide-react';

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
  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="font-bold text-slate-900 text-sm">Filter Catalogue</h3>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Categories Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 cursor-pointer py-1">
            <input
              type="radio"
              name="catalog-category"
              checked={!selectedCategory}
              onChange={() => onCategoryChange(undefined)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className={!selectedCategory ? 'font-bold text-blue-700' : ''}>All Categories</span>
          </label>
          {categories.map((cat) => (
            <label
              key={cat._id}
              className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="catalog-category"
                checked={selectedCategory === cat.slug}
                onChange={() => onCategoryChange(cat.slug)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className={selectedCategory === cat.slug ? 'font-bold text-blue-700' : ''}>
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands Filter */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Brand</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 cursor-pointer py-1">
            <input
              type="radio"
              name="catalog-brand"
              checked={!selectedBrand}
              onChange={() => onBrandChange(undefined)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className={!selectedBrand ? 'font-bold text-blue-700' : ''}>All Brands</span>
          </label>
          {brands.map((brand) => (
            <label
              key={brand._id}
              className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 cursor-pointer py-1"
            >
              <input
                type="radio"
                name="catalog-brand"
                checked={selectedBrand === brand.slug}
                onChange={() => onBrandChange(brand.slug)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className={selectedBrand === brand.slug ? 'font-bold text-blue-700' : ''}>
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Part Condition Filter */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Condition</h4>
        <div className="space-y-1">
          {(['NEW', 'RECONDITIONED', 'USED'] as ProductCondition[]).map((cond) => (
            <label
              key={cond}
              className="flex items-center gap-2 text-xs text-slate-700 hover:text-blue-600 cursor-pointer py-1"
            >
              <input
                type="checkbox"
                checked={selectedCondition === cond}
                onChange={(e) => onConditionChange(e.target.checked ? cond : undefined)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={selectedCondition === cond ? 'font-bold text-blue-700' : ''}>
                {cond === 'NEW' ? 'Brand New' : cond === 'RECONDITIONED' ? 'Reconditioned' : 'Used'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range (in LKR) */}
      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Price Range (Rs.)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ''}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            min={0}
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ''}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            min={0}
          />
        </div>
      </div>
    </div>
  );

  // Desktop sidebar
  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-80 max-w-full bg-white h-full p-5 overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <span className="font-bold text-sm text-slate-900">Filters</span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
