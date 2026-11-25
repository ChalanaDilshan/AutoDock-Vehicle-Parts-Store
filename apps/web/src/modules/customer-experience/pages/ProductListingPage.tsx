import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  productsApi,
  taxonomyApi,
  garageApi,
  cartApi,
  wishlistApi,
  ProductItem,
  CategoryItem,
  BrandItem,
  GarageVehicle,
  ProductCondition,
} from '../api/customerExperienceApi.js';
import { ProductCard } from '../components/ProductCard.js';
import { CatalogFilterSidebar } from '../components/CatalogFilterSidebar.js';
import { VehicleFilterBar } from '../components/VehicleFilterBar.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import { Alert, Button, EmptyState } from '../../../shared/components/index.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const query = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || undefined;
  const selectedBrand = searchParams.get('brand') || undefined;
  const selectedCondition =
    (searchParams.get('condition') as ProductCondition) || undefined;
  const minPrice = searchParams.get('minPrice') || undefined;
  const maxPrice = searchParams.get('maxPrice') || undefined;
  const selectedMake = searchParams.get('make') || undefined;
  const selectedModel = searchParams.get('model') || undefined;
  const selectedYear = searchParams.get('year')
    ? parseInt(searchParams.get('year')!, 10)
    : undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'RELEVANCE';
  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page')!, 10)
    : 1;

  const [searchInput, setSearchInput] = useState<string>(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    taxonomyApi
      .getCategories()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setCategories(res.data);
      })
      .catch(() => {});

    taxonomyApi
      .getBrands()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setBrands(res.data);
      })
      .catch(() => {});

    if (isAuthenticated) {
      garageApi
        .getVehicles()
        .then((res) => {
          if (res.success && res.data?.vehicles) {
            setGarageVehicles(res.data.vehicles);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const resolvedCategoryId = useMemo(() => {
    if (!selectedCategory) return undefined;
    if (OBJECT_ID_REGEX.test(selectedCategory)) return selectedCategory;
    return categories.find((c) => c.slug === selectedCategory)?._id;
  }, [selectedCategory, categories]);

  const resolvedBrandId = useMemo(() => {
    if (!selectedBrand) return undefined;
    if (OBJECT_ID_REGEX.test(selectedBrand)) return selectedBrand;
    return brands.find((b) => b.slug === selectedBrand)?._id;
  }, [selectedBrand, brands]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);

    try {
      const response = await productsApi.search({
        q: query || undefined,
        category: resolvedCategoryId,
        brand: resolvedBrandId,
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
    resolvedCategoryId,
    resolvedBrandId,
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

  const updateParam = (key: string, value?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput.trim() || undefined);
  };

  const handleSelectVehicle = (v?: { make: string; model: string; year?: number }) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v) {
        next.set('make', v.make);
        next.set('model', v.model);
        if (v.year) next.set('year', String(v.year));
        else next.delete('year');
      } else {
        next.delete('make');
        next.delete('model');
        next.delete('year');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddToCart = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await cartApi.addItem({ productId: product._id, quantity: 1 });
      showToast(`Added "${product.name}" to your cart.`);
    } catch {
      showToast('Failed to add item to cart.');
    }
  };

  const handleToggleWishlist = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (wishlistedIds.has(product._id)) {
        await wishlistApi.removeItem(product._id);
        setWishlistedIds((prev) => {
          const next = new Set(prev);
          next.delete(product._id);
          return next;
        });
        showToast(`Removed "${product.name}" from wishlist.`);
      } else {
        await wishlistApi.addItem(product._id);
        setWishlistedIds((prev) => new Set(prev).add(product._id));
        showToast(`Saved "${product.name}" to wishlist.`);
      }
    } catch {
      showToast('Unable to update wishlist.');
    }
  };

  const activeFilterCount = [
    selectedCategory,
    selectedBrand,
    selectedCondition,
    minPrice,
    maxPrice,
    query,
  ].filter(Boolean).length;

  return (
    <div className="bg-slate-50 min-h-screen pb-14">
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-md text-sm font-medium flex items-center gap-2 max-w-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <VehicleFilterBar
        selectedVehicle={
          selectedMake
            ? { make: selectedMake, model: selectedModel, year: selectedYear }
            : undefined
        }
        garageVehicles={garageVehicles}
        onSelectVehicle={handleSelectVehicle}
        onClearVehicle={() => handleSelectVehicle(undefined)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <CatalogFilterSidebar
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            selectedCondition={selectedCondition}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onCategoryChange={(cat) => updateParam('category', cat)}
            onBrandChange={(brd) => updateParam('brand', brd)}
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
            onResetFilters={handleClearFilters}
            isOpenMobile={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
          />

          <div className="flex-1 min-w-0 space-y-5">
            {/* Search & Sort Toolbar */}
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2 flex-1 max-w-md"
              >
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search parts, OEM or SKU..."
                    aria-label="Filter results by keyword"
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Search
                </Button>
              </form>

              <div className="flex items-center justify-between sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  </span>
                </button>

                <span className="text-xs sm:text-sm text-slate-600 whitespace-nowrap">
                  {totalCount} {totalCount === 1 ? 'part' : 'parts'} found
                </span>

                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => updateParam('sortBy', e.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="RELEVANCE">Sort: Relevance</option>
                  <option value="PRICE_ASC">Price: Low to High</option>
                  <option value="PRICE_DESC">Price: High to Low</option>
                  <option value="RATING_DESC">Top Rated</option>
                  <option value="NEWEST">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Active filters:</span>
                {query && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    Search: &ldquo;{query}&rdquo;
                    <button
                      type="button"
                      onClick={() => updateParam('q', undefined)}
                      aria-label="Remove search filter"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    Category:{' '}
                    {categories.find((c) => c.slug === selectedCategory || c._id === selectedCategory)?.name ||
                      selectedCategory}
                    <button
                      type="button"
                      onClick={() => updateParam('category', undefined)}
                      aria-label="Remove category filter"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedBrand && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    Brand:{' '}
                    {brands.find((b) => b.slug === selectedBrand || b._id === selectedBrand)?.name ||
                      selectedBrand}
                    <button
                      type="button"
                      onClick={() => updateParam('brand', undefined)}
                      aria-label="Remove brand filter"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {selectedCondition && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    Condition: {selectedCondition}
                    <button
                      type="button"
                      onClick={() => updateParam('condition', undefined)}
                      aria-label="Remove condition filter"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700">
                    Rs. {minPrice || '0'} &ndash; {maxPrice || 'Any'}
                    <button
                      type="button"
                      onClick={() => {
                        updateParam('minPrice', undefined);
                        updateParam('maxPrice', undefined);
                      }}
                      aria-label="Remove price filter"
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Catalog Content */}
            {isError ? (
              <Alert variant="danger" title="Could not load catalog">
                {isError}
              </Alert>
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {[...Array(6)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 bg-white border border-slate-200 rounded-lg"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<PackageOpen className="w-6 h-6" />}
                title="No matching parts found"
                description="Try clearing some filters, checking a different spelling, or browsing all categories."
                action={
                  <Button variant="outline" onClick={handleClearFilters}>
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlistedIds.has(product._id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateParam('page', String(page + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
