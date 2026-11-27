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
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
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
    setIsLoadingProducts(true);
    setIsLoadingTaxonomy(true);
    setProductsError(null);
    setTaxonomyError(null);

    productsApi
      .getRecommendations({ limit: 8 })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setFeaturedProducts(res.data);
        }
      })
      .catch(() => {
        setProductsError('Unable to load featured products right now.');
      })
      .finally(() => setIsLoadingProducts(false));

    Promise.allSettled([
      taxonomyApi.getCategories(),
      taxonomyApi.getBrands(),
      taxonomyApi.getMakes(),
    ])
      .then(([catRes, brandRes, makeRes]) => {
        let taxonomyFailed = false;
        if (catRes.status === 'fulfilled' && catRes.value.success && Array.isArray(catRes.value.data)) {
          setCategories(catRes.value.data.slice(0, 8));
        } else {
          taxonomyFailed = true;
        }
        if (brandRes.status === 'fulfilled' && brandRes.value.success && Array.isArray(brandRes.value.data)) {
          setBrands(brandRes.value.data.slice(0, 8));
        }
        if (makeRes.status === 'fulfilled' && makeRes.value.success && Array.isArray(makeRes.value.data)) {
          setMakes(makeRes.value.data);
        }
        if (taxonomyFailed) {
          setTaxonomyError('Categories are currently unavailable.');
        }
      })
      .finally(() => setIsLoadingTaxonomy(false));
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
    if (s.includes('elec')) return <Zap className="w-5 h-5" />;
    if (s.includes('susp')) return <Compass className="w-5 h-5" />;
    if (s.includes('body')) return <Car className="w-5 h-5" />;
    return <Package className="w-5 h-5" />;
  };

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
              <p className="text-base text-slate-300 max-w-xl leading-relaxed">
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
      </section>

      {/* Inline Vehicle Finder Bar */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Find Parts for Your Vehicle
                </h2>
                <p className="text-xs text-slate-500">
                  Filter parts confirmed to fit your specific model and production year
                </p>
              </div>
              <Link
                to="/garage"
                className="text-xs font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1"
              >
                <span>Open My Garage</span>
                <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Shop by Category */}
      <section
        id="categories"
        aria-labelledby="shop-by-category-heading"
        className="bg-[#E5E7EB] border-b border-slate-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2
              id="shop-by-category-heading"
              className="text-xl font-semibold text-[#111827] tracking-tight"
            >
              Shop by Category
            </h2>
            <p className="text-sm text-slate-700 mt-0.5">
              Browse parts organized by vehicle system
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
          >
            <span>View All Categories</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {taxonomyError ? (
          <Alert variant="warning">{taxonomyError}</Alert>
        ) : isLoadingTaxonomy ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="h-24 bg-[#1C2433]/20 rounded-lg border border-slate-300"
              />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="flex items-center gap-3 p-4 rounded-lg border border-[#1C2433] bg-[#1C2433] hover:border-[#E11D30] transition-colors"
              >
                <div className="w-10 h-10 rounded-md bg-[#0B121F] text-[#E11D30] flex items-center justify-center shrink-0">
                  {getCategoryIcon(cat.slug || cat.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {cat.name}
                  </div>
                  {cat.description && (
                    <div className="text-xs text-slate-300 truncate mt-0.5">
                      {cat.description}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-slate-300 bg-white rounded-lg text-sm text-slate-600">
            Categories will appear here once added by administrators.
          </div>
        )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-slate-200">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Popular spare parts from verified local suppliers
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm font-medium text-[#E11D30] hover:text-[#BE123C] inline-flex items-center gap-1 shrink-0"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {productsError ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 flex items-center gap-3 text-sm text-slate-700">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{productsError}</span>
          </div>
        ) : isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="h-72 bg-slate-100 rounded-lg border border-slate-200"
              />
            ))}
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

      {/* Practical Value & Deals Strip */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E11D30]">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Quality</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Genuine Parts &amp; Clear Warranty Terms
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every seller passes business registration and bank verification before listing parts on AutoDock.
              </p>
            </div>
            <div>
              <Link to="/products">
                <Button variant="outline" size="sm">
                  Shop Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <Tag className="w-4 h-4" />
                <span>Special Offers</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Compare Prices Across Suppliers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sort parts by price, condition, or rating and view delivery charges upfront by district.
              </p>
            </div>
            <div>
              <Link to="/products?sortBy=PRICE_ASC">
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Strip */}
      {brands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Supported Manufacturers &amp; Brands
              </h2>
              <p className="text-xs text-slate-500">
                Select a brand to view available parts
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link
                  key={b._id}
                  to={`/products?brand=${encodeURIComponent(b.slug)}`}
                  className="px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:border-red-300 hover:text-[#E11D30] text-xs font-medium text-slate-700 transition-colors"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
