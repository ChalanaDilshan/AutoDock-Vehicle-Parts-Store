import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, ArrowRight, Package } from 'lucide-react';
import {
  taxonomyApi,
  productsApi,
  CategoryItem,
  BrandItem,
  ProductItem,
} from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';

type ActiveMenuKey = 'shop-cat' | 'auto-parts' | 'categories' | 'brands' | 'products' | 'makes' | null;

export const StorefrontCategoryBar: React.FC = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeMenu, setActiveMenu] = useState<ActiveMenuKey>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);

  useEffect(() => {
    setActiveMenu(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      typeof taxonomyApi?.getCategories === 'function'
        ? taxonomyApi.getCategories()
        : Promise.resolve(null),
      typeof taxonomyApi?.getBrands === 'function'
        ? taxonomyApi.getBrands()
        : Promise.resolve(null),
      typeof taxonomyApi?.getMakes === 'function'
        ? taxonomyApi.getMakes()
        : Promise.resolve(null),
      typeof productsApi?.getRecommendations === 'function'
        ? productsApi.getRecommendations({ limit: 4 })
        : Promise.resolve(null),
    ]).then(([catRes, brandRes, makeRes, prodRes]) => {
      if (!mounted) return;
      if (catRes.status === 'fulfilled' && catRes.value?.success && Array.isArray(catRes.value.data)) {
        setCategories(catRes.value.data);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value?.success && Array.isArray(brandRes.value.data)) {
        setBrands(brandRes.value.data);
      }
      if (makeRes.status === 'fulfilled' && makeRes.value?.success && Array.isArray(makeRes.value.data)) {
        setMakes(makeRes.value.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value?.success && Array.isArray(prodRes.value.data)) {
        setFeaturedProducts(prodRes.value.data.slice(0, 4));
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const midpoint = Math.ceil(categories.length / 2);
  const leftCategories = categories.slice(0, midpoint);
  const rightCategories = categories.slice(midpoint);

  const toggleMenu = (key: ActiveMenuKey) => {
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  const isMegaMenuOpen = activeMenu === 'auto-parts' || activeMenu === 'categories';

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setActiveMenu(null)}
      className="hidden lg:block relative bg-white border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-11 flex items-center gap-6">
          {/* Left SHOP BY CATEGORY Trigger */}
          <button
            type="button"
            onClick={() => toggleMenu('shop-cat')}
            onMouseEnter={() => setActiveMenu('shop-cat')}
            aria-expanded={activeMenu === 'shop-cat'}
            className="h-full flex items-center gap-2.5 pr-6 border-r border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-blue-700 transition-colors shrink-0"
          >
            <Menu className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <span>Shop By Category</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" aria-hidden="true" />
          </button>

          {/* Horizontal Nav Links + Badges */}
          <nav aria-label="Storefront category navigation" className="flex items-center gap-6 h-full">
            <button
              type="button"
              onClick={() => toggleMenu('auto-parts')}
              onMouseEnter={() => setActiveMenu('auto-parts')}
              aria-expanded={activeMenu === 'auto-parts'}
              className={`relative h-full inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeMenu === 'auto-parts' ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'
              }`}
            >
              <span>Auto Parts</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="absolute top-1 right-0 translate-x-1/2 px-1.5 py-0.5 text-[9px] leading-none font-bold uppercase rounded-sm bg-rose-600 text-white">
                Sale
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleMenu('categories')}
              onMouseEnter={() => setActiveMenu('categories')}
              aria-expanded={activeMenu === 'categories'}
              className={`relative h-full inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeMenu === 'categories' ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'
              }`}
            >
              <span>Categories</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="absolute top-1 right-0 translate-x-1/2 px-1.5 py-0.5 text-[9px] leading-none font-bold uppercase rounded-sm bg-amber-500 text-slate-950">
                Hot
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleMenu('brands')}
              onMouseEnter={() => setActiveMenu('brands')}
              aria-expanded={activeMenu === 'brands'}
              className={`h-full inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeMenu === 'brands' ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'
              }`}
            >
              <span>Brands</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => toggleMenu('products')}
              onMouseEnter={() => setActiveMenu('products')}
              aria-expanded={activeMenu === 'products'}
              className={`relative h-full inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeMenu === 'products' ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'
              }`}
            >
              <span>Products</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span className="absolute top-1 right-0 translate-x-1/2 px-1.5 py-0.5 text-[9px] leading-none font-bold uppercase rounded-sm bg-emerald-600 text-white">
                New
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleMenu('makes')}
              onMouseEnter={() => setActiveMenu('makes')}
              aria-expanded={activeMenu === 'makes'}
              className={`h-full inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
                activeMenu === 'makes' ? 'text-blue-700' : 'text-slate-800 hover:text-blue-700'
              }`}
            >
              <span>Vehicles</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            </button>

            <Link
              to="/products?sortBy=NEWEST"
              className="text-xs font-semibold uppercase tracking-wide text-slate-800 hover:text-blue-700 transition-colors"
            >
              New Arrivals
            </Link>

            <Link
              to="/products?sortBy=RATING_DESC"
              className="text-xs font-semibold uppercase tracking-wide text-slate-800 hover:text-blue-700 transition-colors"
            >
              Top Rated
            </Link>
          </nav>
        </div>
      </div>

      {/* SHOP BY CATEGORY Compact Dropdown */}
      {activeMenu === 'shop-cat' && (
        <div className="absolute left-0 right-0 top-full z-50 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="w-72 bg-white border border-slate-200 rounded-b-lg shadow-lg py-2 pointer-events-auto">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    to={`/products?category=${encodeURIComponent(cat.slug)}`}
                    onClick={() => setActiveMenu(null)}
                    className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                  >
                    <span>{cat.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  </Link>
                ))
              ) : (
                <Link
                  to="/products"
                  onClick={() => setActiveMenu(null)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Browse All Parts
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full-Width Mega Menu (Auto Parts / Categories) */}
      {isMegaMenuOpen && (
        <div className="absolute left-0 right-0 top-full z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-slate-200 rounded-b-lg shadow-lg p-6 grid grid-cols-12 gap-6">
              {/* Left 2 Columns: System Categories */}
              <div className="col-span-4 grid grid-cols-2 gap-6 border-r border-slate-200 pr-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Core Systems
                  </h3>
                  <ul className="space-y-2">
                    {leftCategories.map((cat) => (
                      <li key={cat._id || cat.slug}>
                        <Link
                          to={`/products?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setActiveMenu(null)}
                          className="text-xs text-slate-600 hover:text-blue-700 transition-colors block"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    Service &amp; Wear
                  </h3>
                  <ul className="space-y-2">
                    {rightCategories.map((cat) => (
                      <li key={cat._id || cat.slug}>
                        <Link
                          to={`/products?category=${encodeURIComponent(cat.slug)}`}
                          onClick={() => setActiveMenu(null)}
                          className="text-xs text-slate-600 hover:text-blue-700 transition-colors block"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Middle Column: Featured Products 2x2 */}
              <div className="col-span-4 bg-slate-50/70 rounded-lg p-4 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 text-center mb-3">
                  Featured Products
                </h3>
                {featuredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {featuredProducts.map((product) => {
                      const thumb =
                        product.images?.find((img) => img.isPrimary)?.url ||
                        product.images?.[0]?.url;
                      return (
                        <Link
                          key={product._id}
                          to={`/products/${product._id}`}
                          onClick={() => setActiveMenu(null)}
                          className="bg-white border border-slate-200 hover:border-blue-300 rounded-md p-2 flex items-center gap-2.5 transition-colors"
                        >
                          <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={product.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" aria-hidden="true" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-tight">
                              {product.name}
                            </p>
                            <p className="text-xs font-bold text-slate-900 tabular-nums mt-1">
                              {formatLKR(product.priceInCents)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Explore verified parts in our catalog.
                  </div>
                )}
              </div>

              {/* Right Column: Dark Promo Banner Card */}
              <div className="col-span-4">
                <Link
                  to="/products?sortBy=NEWEST"
                  onClick={() => setActiveMenu(null)}
                  className="relative block h-full min-h-[175px] rounded-lg overflow-hidden bg-slate-900 border border-slate-800 group"
                >
                  <img
                    src="/hero-wheel.jpg"
                    alt="AutoDock Genuine Spare Parts"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="relative z-10 h-full p-5 flex flex-col justify-between bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent">
                    <div className="space-y-1.5">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-blue-600 text-white">
                        New Arrivals
                      </span>
                      <h4 className="text-lg font-bold text-white leading-snug">
                        OEM &amp; Aftermarket Parts
                      </h4>
                      <p className="text-xs text-slate-200">
                        Verified Sri Lankan sellers &amp; LKR checkout
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 underline underline-offset-4">
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brands Dropdown */}
      {activeMenu === 'brands' && (
        <div className="absolute left-0 right-0 top-full z-50 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-slate-200 rounded-b-lg shadow-lg p-5 pointer-events-auto max-w-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Manufacturers &amp; Brands
                </h3>
                <Link
                  to="/products"
                  onClick={() => setActiveMenu(null)}
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                >
                  View All Parts &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {brands.map((brand) => (
                  <Link
                    key={brand._id || brand.slug}
                    to={`/products?brand=${encodeURIComponent(brand.slug)}`}
                    onClick={() => setActiveMenu(null)}
                    className="px-3 py-2 rounded-md border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-xs font-semibold text-slate-800 flex items-center justify-between"
                  >
                    <span>{brand.name}</span>
                    {brand.countryOfOrigin && (
                      <span className="text-[11px] font-normal text-slate-500">
                        {brand.countryOfOrigin}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Quick Filters Dropdown */}
      {activeMenu === 'products' && (
        <div className="absolute left-0 right-0 top-full z-50 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-80">
            <div className="w-64 bg-white border border-slate-200 rounded-b-lg shadow-lg py-2 pointer-events-auto">
              <Link
                to="/products?sortBy=NEWEST"
                onClick={() => setActiveMenu(null)}
                className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Latest Arrivals
              </Link>
              <Link
                to="/products?sortBy=RATING_DESC"
                onClick={() => setActiveMenu(null)}
                className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Top Rated Spare Parts
              </Link>
              <Link
                to="/products?condition=NEW"
                onClick={() => setActiveMenu(null)}
                className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Brand New Parts
              </Link>
              <Link
                to="/products?condition=RECONDITIONED"
                onClick={() => setActiveMenu(null)}
                className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Reconditioned Parts
              </Link>
              <Link
                to="/products?sortBy=PRICE_ASC"
                onClick={() => setActiveMenu(null)}
                className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                Price: Low to High
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Dropdown */}
      {activeMenu === 'makes' && (
        <div className="absolute left-0 right-0 top-full z-50 pointer-events-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pl-96">
            <div className="w-64 bg-white border border-slate-200 rounded-b-lg shadow-lg py-2 pointer-events-auto">
              {makes.length > 0 ? (
                makes.map((make) => (
                  <Link
                    key={make}
                    to={`/products?make=${encodeURIComponent(make)}`}
                    onClick={() => setActiveMenu(null)}
                    className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {make} Parts
                  </Link>
                ))
              ) : (
                <div className="px-4 py-2 text-xs text-slate-500">
                  Use Vehicle Finder to filter by model
                </div>
              )}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <Link
                  to="/garage"
                  onClick={() => setActiveMenu(null)}
                  className="block px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Open Saved Vehicles &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
