import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import {
  ProductItem,
  CategoryItem,
  BrandItem,
  GarageVehicle,
  ProductCondition,
  productsApi,
  taxonomyApi,
  garageApi,
  cartApi,
  wishlistApi,
} from '../api/customerExperienceApi.js';
import { ProductCard } from '../components/ProductCard.js';
import { CatalogFilterSidebar } from '../components/CatalogFilterSidebar.js';
import { VehicleFilterBar } from '../components/VehicleFilterBar.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  // Extracted query parameters
  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || undefined;
  const selectedBrand = searchParams.get('brand') || undefined;
  const selectedCondition = (searchParams.get('condition') as ProductCondition) || undefined;
  const minPrice = searchParams.get('minPrice') || undefined;
  const maxPrice = searchParams.get('maxPrice') || undefined;
  const selectedMake = searchParams.get('make') || undefined;
  const selectedModel = searchParams.get('model') || undefined;
  const selectedYear = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'RELEVANCE';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  const [searchInput, setSearchInput] = useState<string>(query);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Load initial taxonomies and customer garage (if logged in)
  useEffect(() => {
    taxonomyApi.getCategories().then((res) => {
      if (res.success && Array.isArray(res.data)) setCategories(res.data);
    }).catch(() => {});

    taxonomyApi.getBrands().then((res) => {
      if (res.success && Array.isArray(res.data)) setBrands(res.data);
    }).catch(() => {});

    if (isAuthenticated) {
      garageApi.getVehicles().then((res) => {
        if (res.success && res.data?.vehicles) {
          setGarageVehicles(res.data.vehicles);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch products matching parameters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);

    try {
      const response = await productsApi.search({
        q: query || undefined,
        category: selectedCategory,
        brand: selectedBrand,
        condition: selectedCondition,
        minPrice: minPrice ? parseInt(minPrice, 10) * 100 : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice, 10) * 100 : undefined,
        make: selectedMake,
        model: selectedModel,
        year: selectedYear,
        sortBy,
        page,
        limit: 12,
      });

      if (response.success && response.data) {
        setProducts(response.data.items || []);
        setTotalCount(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (err: any) {
      setIsError(err?.message || 'Failed to fetch spare parts catalogue.');
    } finally {
      setIsLoading(false);
    }
  }, [
    query,
    selectedCategory,
    selectedBrand,
    selectedCondition,
    minPrice,
    maxPrice,
    selectedMake,
    selectedModel,
    selectedYear,
    sortBy,
    page,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Helper to update search params while preserving others
  const updateParam = (key: string, value?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value !== undefined && value !== '') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 on filter/sort changes
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim() || undefined);
  };

  const handleSelectVehicle = (vehicle?: { make: string; model: string; year?: number }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (vehicle) {
        next.set('make', vehicle.make);
        next.set('model', vehicle.model);
        if (vehicle.year) next.set('year', vehicle.year.toString());
      } else {
        next.delete('make');
        next.delete('model');
        next.delete('year');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleClearVehicle = () => {
    handleSelectVehicle(undefined);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    setSearchInput('');
  };

  const handleAddToCart = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await cartApi.addItem({ productId: product._id, quantity: 1 });
  };

  const handleToggleWishlist = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await wishlistApi.addItem(product._id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Vehicle Fitment Switcher Bar */}
      <VehicleFilterBar
        selectedVehicle={
          selectedMake && selectedModel
            ? { make: selectedMake, model: selectedModel, year: selectedYear }
            : undefined
        }
        garageVehicles={garageVehicles}
        onSelectVehicle={handleSelectVehicle}
        onClearVehicle={handleClearVehicle}
      />

      {/* Main Content Layout (Sidebar + Results) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop & Mobile Filter Sidebar */}
        <CatalogFilterSidebar
          categories={categories}
          brands={brands}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          selectedCondition={selectedCondition}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onCategoryChange={(cat) => updateParam('category', cat)}
          onBrandChange={(brand) => updateParam('brand', brand)}
          onConditionChange={(cond) => updateParam('condition', cond)}
          onPriceChange={(min, max) => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              if (min) next.set('minPrice', min);
              else next.delete('minPrice');
              if (max) next.set('maxPrice', max);
              else next.delete('maxPrice');
              next.set('page', '1');
              return next;
            });
          }}
          onResetFilters={handleResetFilters}
          isOpenMobile={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
        />

        {/* Results Stream */}
        <main className="flex-1 w-full space-y-4">
          {/* Top Control Bar (Search, Count, Sort, Mobile Filter Button) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search part name, OEM, or SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">
                {isLoading ? 'Searching...' : `${totalCount} parts found`}
              </span>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Filters</span>
              </button>

              {/* Sort Allowlist Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="RELEVANCE">Sort: Relevance</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="NEWEST">Newest Listings</option>
                <option value="RATING_DESC">Customer Ratings</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(selectedCategory || selectedBrand || selectedCondition || minPrice || maxPrice || query) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Active filters:</span>
              {query && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Query: {query}
                  <button onClick={() => updateParam('q', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Category: {selectedCategory}
                  <button onClick={() => updateParam('category', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedBrand && (
                <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Brand: {selectedBrand}
                  <button onClick={() => updateParam('brand', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedCondition && (
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  Condition: {selectedCondition}
                  <button onClick={() => updateParam('condition', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:underline font-semibold ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Error Banner */}
          {isError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="flex-1">
                <span className="font-bold">Error loading catalogue:</span> {isError}
              </div>
              <button
                type="button"
                onClick={fetchProducts}
                className="font-bold underline hover:no-underline text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Product Grid / Loading / Empty */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 p-4 h-80 animate-pulse flex flex-col justify-between"
                >
                  <div className="bg-slate-200 aspect-video rounded-lg w-full mb-3" />
                  <div className="space-y-2">
                    <div className="bg-slate-200 h-3 w-1/3 rounded" />
                    <div className="bg-slate-200 h-4 w-3/4 rounded" />
                    <div className="bg-slate-200 h-3 w-1/2 rounded" />
                  </div>
                  <div className="bg-slate-200 h-8 rounded-lg mt-4" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  fitmentBadge={
                    selectedMake && selectedModel
                      ? {
                          status: product.isUniversalFit ? 'UNIVERSAL_FIT' : 'EXACT_FIT',
                          label: product.isUniversalFit
                            ? 'Universal Fit'
                            : `Fits ${selectedYear || ''} ${selectedMake}`,
                        }
                      : undefined
                  }
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <PackageOpen className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  No spare parts found matching your criteria
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Try broadening your keyword, resetting category/brand filters, or clearing vehicle fitment restrictions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Pagination Bar */}
          {!isLoading && totalPages > 1 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParam('page', (page - 1).toString())}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-medium text-slate-600">
                Page <strong className="text-slate-900">{page}</strong> of{' '}
                <strong className="text-slate-900">{totalPages}</strong>
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateParam('page', (page + 1).toString())}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
