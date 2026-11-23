import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
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
          {/* Top Control Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search part name, OEM, or SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </form>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">
                {isLoading ? 'Searching...' : `${totalCount} parts found`}
              </span>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold text-slate-700 flex items-center gap-1.5 hover:bg-slate-50"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>Filters</span>
              </button>

              {/* Sort Allowlist Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 font-medium focus:border-blue-600 outline-none"
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Active filters:</span>
              {query && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                  Query: {query}
                  <button onClick={() => updateParam('q', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-200">
                  Category: {selectedCategory}
                  <button onClick={() => updateParam('category', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedBrand && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                  Brand: {selectedBrand}
                  <button onClick={() => updateParam('brand', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {selectedCondition && (
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                  Condition: {selectedCondition}
                  <button onClick={() => updateParam('condition', undefined)} className="hover:text-red-600 font-bold ml-1">×</button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
                  Rs. {minPrice || '0'} - {maxPrice || '∞'}
                  <button
                    onClick={() => {
                      updateParam('minPrice', undefined);
                      updateParam('maxPrice', undefined);
                    }}
                    className="hover:text-red-600 font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Main Results Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-lg border border-slate-200 p-4 h-72 animate-pulse flex flex-col justify-between">
                  <div className="bg-slate-100 aspect-video rounded-md w-full" />
                  <div className="space-y-2 py-3">
                    <div className="bg-slate-100 h-3 w-1/3 rounded" />
                    <div className="bg-slate-100 h-4 w-3/4 rounded" />
                  </div>
                  <div className="bg-slate-100 h-8 rounded-md" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 bg-white rounded-lg border border-red-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-semibold text-red-800">{isError}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
              >
                Retry Search
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 bg-white rounded-lg border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <PackageOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-base text-slate-900">No matching spare parts found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your search keywords, clearing vehicle filters, or adjusting the price range.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', (page - 1).toString())}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-medium text-slate-700 px-3 py-1.5 bg-white rounded border border-slate-300">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => updateParam('page', (page + 1).toString())}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
