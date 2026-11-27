import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Tag,
  Package,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Droplets,
  Disc,
  Zap,
  Compass,
  Car,
  Truck,
  BadgeCheck,
  Thermometer,
  Settings,
} from 'lucide-react';
import {
  productsApi,
  taxonomyApi,
  cartApi,
  wishlistApi,
  ProductItem,
  CategoryItem,
  BrandItem,
} from '../api/customerExperienceApi.js';
import { ProductCard } from '../components/ProductCard.js';
import { HomeHeroVisual } from '../components/HomeHeroVisual.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import { Button, Select, Alert } from '../../../shared/components/index.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductItem[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => String(currentYear - i));

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProducts(true);
    setIsLoadingLatest(true);
    setIsLoadingTaxonomy(true);
    setProductsError(null);
    setTaxonomyError(null);

    productsApi
      .getRecommendations({ limit: 8 })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.data)) {
          setFeaturedProducts(res.data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setProductsError('Unable to load featured products right now.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingProducts(false);
      });

    if (typeof productsApi.search === 'function') {
      Promise.allSettled([
        productsApi.search({ sortBy: 'NEWEST', limit: 8 }),
        productsApi.search({ sortBy: 'RATING_DESC', limit: 6 }),
      ])
        .then(([newestRes, popularRes]) => {
          if (!isMounted) return;
          if (
            newestRes.status === 'fulfilled' &&
            newestRes.value?.success &&
            Array.isArray(newestRes.value.data?.items)
          ) {
            setLatestProducts(newestRes.value.data.items);
          }
          if (
            popularRes.status === 'fulfilled' &&
            popularRes.value?.success &&
            Array.isArray(popularRes.value.data?.items)
          ) {
            setPopularProducts(popularRes.value.data.items);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingLatest(false);
        });
    } else {
      setIsLoadingLatest(false);
    }

    Promise.allSettled([
      taxonomyApi.getCategories(),
      taxonomyApi.getBrands(),
      taxonomyApi.getMakes(),
    ])
      .then(([catRes, brandRes, makeRes]) => {
        if (!isMounted) return;
        let taxonomyFailed = false;
        if (catRes.status === 'fulfilled' && catRes.value.success && Array.isArray(catRes.value.data)) {
          setCategories(catRes.value.data.slice(0, 8));
        } else {
          taxonomyFailed = true;
        }
        if (brandRes.status === 'fulfilled' && brandRes.value.success && Array.isArray(brandRes.value.data)) {
          setBrands(brandRes.value.data.slice(0, 10));
        }
        if (makeRes.status === 'fulfilled' && makeRes.value.success && Array.isArray(makeRes.value.data)) {
          setMakes(makeRes.value.data);
        }
        if (taxonomyFailed) {
          setTaxonomyError('Categories are currently unavailable.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingTaxonomy(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      setSelectedModel('');
      return;
    }
    taxonomyApi
      .getModels(selectedMake)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setModels(res.data);
        }
      })
      .catch(() => setModels([]));
  }, [selectedMake]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedMake) params.set('make', selectedMake);
    if (selectedModel) params.set('model', selectedModel);
    if (selectedYear) params.set('year', selectedYear);
    navigate(`/products?${params.toString()}`);
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

  const getCategoryIcon = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('engine')) return <Wrench className="w-5 h-5" />;
    if (s.includes('brake')) return <Disc className="w-5 h-5" />;
    if (s.includes('filter') || s.includes('fluid')) return <Droplets className="w-5 h-5" />;
    if (s.includes('elec') || s.includes('spark')) return <Zap className="w-5 h-5" />;
    if (s.includes('cool')) return <Thermometer className="w-5 h-5" />;
    if (s.includes('trans')) return <Settings className="w-5 h-5" />;
    if (s.includes('susp')) return <Compass className="w-5 h-5" />;
    if (s.includes('body')) return <Car className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

  const stripCategories = categories.slice(0, 7);

  return (
    <div className="bg-white">
      {/* Live Status Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-md text-sm font-medium flex items-center gap-2.5 max-w-sm border border-slate-700"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Band */}
      <section className="bg-[#0B121F] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#FB2C36]">
                Sri Lanka Vehicle Spare-Parts Marketplace
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Quality Vehicle Parts for a Smoother Ride
              </h1>
              <p className="text-base text-slate-200 max-w-xl leading-relaxed">
                Find the right parts for your vehicle. Wide range. Trusted sellers.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link to="/products">
                  <Button
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Shop Now
                  </Button>
                </Link>
                <a href="#categories">
                  <Button variant="secondary-dark" size="lg">
                    Browse Categories
                  </Button>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <HomeHeroVisual />
            </div>
          </div>
        </div>

        {/* Featured Categories Strip (#categories) */}
        <div
          id="categories"
          aria-labelledby="shop-by-category-heading"
          className="scroll-mt-32 bg-[#E5E7EB] border-t border-slate-300"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2
                id="shop-by-category-heading"
                className="text-sm font-semibold text-[#111827]"
              >
                Shop by Category
              </h2>
              <Link
                to="/products"
                className="min-h-[44px] px-1 text-xs font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
              >
                <span>View All Categories</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            {taxonomyError ? (
              <Alert variant="warning">{taxonomyError}</Alert>
            ) : isLoadingTaxonomy ? (
              <div role="status" aria-live="polite" className="space-y-2">
                <p className="sr-only">Loading vehicle system categories...</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[...Array(7)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-20 bg-[#1C2433]/20 rounded-lg border border-slate-300"
                    />
                  ))}
                </div>
              </div>
            ) : stripCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {stripCategories.map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    to={`/products?category=${encodeURIComponent(cat.slug)}`}
                    className="group min-h-[44px] flex flex-col items-center text-center gap-2 px-3 py-3 rounded-lg border border-[#1C2433] bg-[#1C2433] hover:border-[#E11D30] transition-colors"
                  >
                    <span className="w-10 h-10 rounded-full border border-slate-700 bg-[#0B121F] text-[#E11D30] group-hover:border-[#E11D30] group-hover:text-white flex items-center justify-center transition-colors">
                      {getCategoryIcon(cat.slug || cat.name)}
                    </span>
                    <span className="text-xs font-medium text-white line-clamp-1">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-slate-300 bg-white rounded-lg text-xs text-slate-600">
                Categories will appear here once added by administrators.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Inline Vehicle Finder Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Find Parts for Your Vehicle
                </h2>
                <p className="text-xs text-slate-600">
                  Filter parts confirmed to fit your specific model and production year
                </p>
              </div>
              <Link
                to="/garage"
                className="min-h-[44px] px-1 text-xs font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1"
              >
                <span>Open My Garage</span>
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <form
              onSubmit={handleVehicleSearch}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              <Select
                aria-label="Vehicle Make"
                value={selectedMake}
                onChange={(e) => setSelectedMake(e.target.value)}
                placeholder="Select Make"
                options={makes.map((m) => ({ value: m, label: m }))}
              />
              <Select
                aria-label="Vehicle Model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!selectedMake}
                placeholder="Select Model"
                options={models.map((m) => ({ value: m, label: m }))}
              />
              <Select
                aria-label="Vehicle Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="Select Year"
                options={years.map((y) => ({ value: y, label: y }))}
              />
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Search className="w-4 h-4" />}
                fullWidth
              >
                Search Parts
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Dual Promotional Sub-Banners (Asymmetric Contrast) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7 rounded-lg bg-[#0B121F] text-white border border-slate-800 p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FB2C36]">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Verified Quality</span>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Genuine Parts &amp; Clear Warranty Terms
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                Every seller passes business registration and bank verification before listing parts on AutoDock.
              </p>
            </div>
            <div>
              <Link to="/products">
                <Button variant="primary" size="md">
                  Browse Verified Parts
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 rounded-lg bg-red-50 text-slate-900 border border-red-200 p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Tag className="w-4 h-4" aria-hidden="true" />
                <span>Special Offers</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Compare Prices Across Suppliers
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed">
                Sort parts by price, condition, or rating and view delivery charges upfront by district.
              </p>
            </div>
            <div>
              <Link to="/products?sortBy=PRICE_ASC">
                <Button variant="outline" size="md">
                  Compare Lowest Prices
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      {(isLoadingLatest || latestProducts.length > 0) && (
        <section
          aria-labelledby="latest-products-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-200"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2
                id="latest-products-heading"
                className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
              >
                Latest Products
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Newly added spare parts from verified local suppliers
              </p>
            </div>
            <Link
              to="/products?sortBy=NEWEST"
              className="min-h-[44px] px-1 text-sm font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
            >
              <span>Browse Latest</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {isLoadingLatest ? (
            <div role="status" aria-live="polite" className="space-y-3">
              <p className="text-xs text-slate-600">Loading latest spare parts...</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(4)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 bg-slate-100 rounded-lg border border-slate-200"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {latestProducts.map((product) => (
                <ProductCard
                  key={`latest-${product._id}`}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlistedIds.has(product._id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured Products */}
      <section
        aria-labelledby="featured-products-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-slate-200"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2
              id="featured-products-heading"
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
            >
              Featured Products
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Recommended spare parts tailored to popular vehicles
            </p>
          </div>
          <Link
            to="/products"
            className="min-h-[44px] px-1 text-sm font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {productsError ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 flex items-center gap-3 text-sm text-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
            <span>{productsError}</span>
          </div>
        ) : isLoadingProducts ? (
          <div role="status" aria-live="polite" className="space-y-3">
            <p className="text-xs text-slate-600">Loading featured spare parts...</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-72 bg-slate-100 rounded-lg border border-slate-200"
                />
              ))}
            </div>
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                isWishlisted={wishlistedIds.has(product._id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
            <p className="text-sm font-medium text-slate-900">
              No featured products available yet
            </p>
            <p className="text-sm text-slate-600">
              Browse the full parts catalog or check back once sellers publish inventory.
            </p>
            <div className="pt-2">
              <Link to="/products">
                <Button variant="outline" size="sm">
                  Explore Catalog
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Popular Products Dark Showcase */}
      {popularProducts.length > 0 && (
        <section
          aria-labelledby="popular-products-heading"
          className="bg-[#0B121F] text-white border-b border-slate-800 py-12"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-[#FB2C36]">
                  Top Rated by Buyers
                </p>
                <h2
                  id="popular-products-heading"
                  className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5"
                >
                  Popular Products
                </h2>
              </div>
              <Link
                to="/products?sortBy=RATING_DESC"
                className="min-h-[44px] px-1 text-sm font-medium text-[#FB2C36] hover:text-red-300 inline-flex items-center gap-1 shrink-0"
              >
                <span>Top Rated Catalog</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularProducts.map((product) => (
                <ProductCard
                  key={`popular-${product._id}`}
                  product={product}
                  variant="compact"
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust & Marketplace Guarantees Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#E11D30] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Verified Sellers</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Onboarded Sri Lankan parts stores with reviewed documents
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#E11D30] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Island-Wide Delivery</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Seller-specific district rates shown upfront at checkout
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#E11D30] flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Fitment Checking</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Match spare parts by vehicle make, model, and year
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-[#E11D30] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Direct LKR Checkout</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  COD and verified seller bank-transfer support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Brands Bordered Matrix */}
      {brands.length > 0 && (
        <section
          aria-labelledby="popular-brands-heading"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2
                id="popular-brands-heading"
                className="text-xl font-semibold text-slate-900 tracking-tight"
              >
                Popular Manufacturers &amp; Brands
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Select an OEM or aftermarket brand to filter parts
              </p>
            </div>
            <Link
              to="/products"
              className="min-h-[44px] px-1 text-sm font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
            >
              <span>All Parts</span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-l border-slate-200 rounded-lg overflow-hidden">
            {brands.map((b) => (
              <Link
                key={b._id || b.slug}
                to={`/products?brand=${encodeURIComponent(b.slug)}`}
                className="min-h-[64px] p-4 border-r border-b border-slate-200 bg-white hover:bg-red-50/40 hover:text-[#E11D30] transition-colors flex flex-col items-center justify-center text-center gap-1"
              >
                <span className="text-sm font-bold text-slate-900 tracking-tight">
                  {b.name}
                </span>
                {b.countryOfOrigin && (
                  <span className="text-xs text-slate-600">{b.countryOfOrigin}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
