import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car,
  Search,
  ShieldCheck,
  Truck,
  RotateCcw,
  Wrench,
  ChevronRight,
  ArrowRight,
  Award,
  CheckCircle2,
  Zap,
  Disc,
  Droplets,
  Settings,
  Flame,
  Tag,
  AlertCircle,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ProductItem,
  CategoryItem,
  BrandItem,
  productsApi,
  taxonomyApi,
  cartApi,
  wishlistApi,
} from '../api/customerExperienceApi.js';
import { ProductCard } from '../components/ProductCard.js';
import { HomeHeroVisual } from '../components/HomeHeroVisual.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import { Button, Select, Card, Badge } from '../../../shared/components/index.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [recommendedProducts, setRecommendedProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Popular quick search chips in Sri Lanka
  const popularSearches = [
    'Brake Pads',
    'Oil Filter',
    'Shock Absorbers',
    'Spark Plugs',
    'Clutch Kit',
    'Headlights',
    'Wiper Blades',
  ];

  // Year options for the vehicle selector dropdown
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: Array<{ value: string; label: string }> = [];
    for (let y = currentYear; y >= 1980; y -= 1) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, catRes, brandRes, makeRes] = await Promise.allSettled([
          productsApi.getRecommendations({ limit: 8 }),
          taxonomyApi.getCategories(),
          taxonomyApi.getBrands(),
          taxonomyApi.getMakes(),
        ]);

        if (recRes.status === 'fulfilled' && recRes.value.success) {
          setRecommendedProducts(recRes.value.data || []);
          setProductsError(null);
        } else {
          setProductsError('Unable to load featured products right now.');
        }

        if (catRes.status === 'fulfilled' && catRes.value.success) {
          setCategories(catRes.value.data || []);
          setCategoriesError(null);
        } else {
          setCategoriesError('Categories are currently unavailable.');
        }

        if (brandRes.status === 'fulfilled' && brandRes.value.success) {
          setBrands(brandRes.value.data || []);
        }

        if (makeRes.status === 'fulfilled' && makeRes.value.success) {
          setMakes(makeRes.value.data || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMake) {
      taxonomyApi
        .getModels(selectedMake)
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setModels(res.data);
          }
        })
        .catch(() => {
          setModels([]);
        });
    } else {
      setModels([]);
    }
  }, [selectedMake]);

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedMake) params.set('make', selectedMake);
    if (selectedModel) params.set('model', selectedModel);
    if (selectedYear) params.set('year', selectedYear);
    navigate(`/products?${params.toString()}`);
  };

  const handleQuickTagClick = (tag: string) => {
    navigate(`/products?q=${encodeURIComponent(tag)}`);
  };

  const handleAddToCart = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await cartApi.addItem({ productId: product._id, quantity: 1 });
      setActionMessage(`Added "${product.name}" to your cart.`);
    } catch {
      setActionMessage('Could not add item to cart. Please try again.');
    }
  };

  const handleToggleWishlist = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await wishlistApi.addItem(product._id);
      setActionMessage(`Saved "${product.name}" to your wishlist.`);
    } catch {
      setActionMessage('Could not update wishlist. Please try again.');
    }
  };

  // Helper icon selector matching proposal & backend category slugs
  const getCategoryIcon = (slug?: string, name?: string) => {
    const key = `${slug || ''} ${name || ''}`.toLowerCase();
    if (key.includes('brake')) return <Disc className="w-5 h-5 text-blue-600" />;
    if (key.includes('suspension')) return <SlidersHorizontal className="w-5 h-5 text-sky-600" />;
    if (key.includes('engine') || key.includes('drivetrain')) return <Flame className="w-5 h-5 text-amber-600" />;
    if (key.includes('filter') || key.includes('fluid')) return <Droplets className="w-5 h-5 text-teal-600" />;
    if (key.includes('electrical') || key.includes('light')) return <Zap className="w-5 h-5 text-indigo-600" />;
    if (key.includes('body')) return <Shield className="w-5 h-5 text-slate-700" />;
    if (key.includes('transmission')) return <Settings className="w-5 h-5 text-slate-700" />;
    return <Wrench className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-12 overflow-x-hidden">
      {/* 1. Hero Section (Aligned with Proposal Wireframe Page 12) */}
      <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 border border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <Badge variant="primary" size="md" className="bg-blue-950/80 text-blue-300 border-blue-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Sri Lanka&apos;s Verified Vehicle Spare-Parts Marketplace</span>
            </Badge>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Quality Vehicle Parts for a Smoother Ride
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Find the right parts for your vehicle. Wide range. Trusted sellers.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link to="/products">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Shop Now
                </Button>
              </Link>
              <Link to="/garage">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                  leftIcon={<Car className="w-4 h-4 text-blue-400" />}
                >
                  My Garage
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HomeHeroVisual />
          </div>
        </div>
      </section>

      {/* 2. Find Parts for Your Vehicle (Make, Model, Year Dropdowns + Search Parts) */}
      <section aria-labelledby="vehicle-finder-heading">
        <Card padding="md" className="border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600 shrink-0" />
              <h2 id="vehicle-finder-heading" className="text-base sm:text-lg font-bold text-slate-900">
                Find Parts for Your Vehicle
              </h2>
            </div>
            <Link
              to="/garage"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Open My Garage</span>
            </Link>
          </div>

          <form onSubmit={handleVehicleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <Select
              label="Make"
              aria-label="Vehicle Make"
              placeholder="Select Make"
              value={selectedMake}
              options={makes.map((m) => ({ value: m, label: m }))}
              onChange={(e) => {
                setSelectedMake(e.target.value);
                setSelectedModel('');
              }}
            />

            <Select
              label="Model"
              aria-label="Vehicle Model"
              placeholder="Select Model"
              value={selectedModel}
              disabled={!selectedMake}
              options={models.map((m) => ({ value: m, label: m }))}
              onChange={(e) => setSelectedModel(e.target.value)}
            />

            <Select
              label="Year"
              aria-label="Vehicle Year"
              placeholder="Select Year"
              value={selectedYear}
              options={yearOptions}
              onChange={(e) => setSelectedYear(e.target.value)}
            />

            <Button
              type="submit"
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Search className="w-4 h-4" />}
              className="h-[38px]"
            >
              Search Parts
            </Button>
          </form>

          {/* Popular quick search tags */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Popular searches:</span>
            {popularSearches.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-medium border border-slate-200 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Value Highlights */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <Wrench className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Guaranteed Fitment</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Matched to your vehicle chassis</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Verified Merchants</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Vetted physical stores</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Island-wide Delivery</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">All 25 districts covered</p>
          </div>
        </Card>

        <Card padding="sm" className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <RotateCcw className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Direct Settlement</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Bank deposit &amp; COD options</p>
          </div>
        </Card>
      </section>

      {/* 3. Shop by Category */}
      <section className="space-y-4" aria-labelledby="shop-by-category-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 id="shop-by-category-heading" className="text-xl font-bold text-slate-900 tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div
                key={n}
                className="bg-white p-4 rounded-lg border border-slate-200 min-h-[110px] animate-pulse flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="h-3 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${encodeURIComponent(cat.slug)}`}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-slate-50/70 transition text-center group flex flex-col items-center justify-center min-h-[112px]"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                  {getCategoryIcon(cat.slug, cat.name)}
                </div>
                <h3 className="font-medium text-xs text-slate-800 group-hover:text-blue-600 transition leading-snug">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <Card padding="md" className="text-center text-xs text-slate-500">
            <p>{categoriesError || 'No categories available right now.'}</p>
            <Link to="/products" className="text-blue-600 font-semibold hover:underline inline-block mt-2">
              Browse Full Catalogue
            </Link>
          </Card>
        )}
      </section>

      {/* 4. Featured Products */}
      <section className="space-y-4" aria-labelledby="featured-products-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 id="featured-products-heading" className="text-xl font-bold text-slate-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Recommended spare parts based on availability, vehicle fitment, and vetted seller listings.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 group py-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {actionMessage && (
          <div
            role="status"
            className="bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium px-4 py-2.5 rounded-md flex items-center justify-between"
          >
            <span>{actionMessage}</span>
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-lg border border-slate-200 p-4 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="bg-slate-100 aspect-video rounded-md w-full" />
                <div className="space-y-2 py-3">
                  <div className="bg-slate-100 h-3 w-1/3 rounded" />
                  <div className="bg-slate-100 h-4 w-3/4 rounded" />
                </div>
                <div className="bg-slate-100 h-8 rounded-md" />
              </div>
            ))}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center text-xs text-slate-500 space-y-2">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-500">
              <AlertCircle className="w-4 h-4" />
            </div>
            <p className="font-medium text-slate-700">
              {productsError || 'No products currently featured.'}
            </p>
            <p>Visit the catalogue to explore all available spare parts.</p>
            <div className="pt-1">
              <Link to="/products">
                <Button variant="outline" size="sm">
                  Explore Catalogue
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* 5. Promotional Banners (Aligned with Proposal Wireframe Page 12) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" aria-label="Promotional Highlights">
        <Card
          padding="lg"
          className="bg-slate-100 border-slate-200 flex flex-col justify-between gap-4"
        >
          <div className="space-y-2">
            <Badge variant="primary" size="sm">
              Verified Quality
            </Badge>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Genuine Parts &ndash; Trusted Performance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Source OEM and trusted aftermarket components from verified Sri Lankan spare-parts merchants with clear vehicle compatibility details.
            </p>
          </div>
          <div>
            <Link to="/products">
              <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Learn More
              </Button>
            </Link>
          </div>
        </Card>

        <Card
          padding="lg"
          variant="dark"
          className="flex flex-col justify-between gap-4 relative overflow-hidden"
        >
          <div className="space-y-2 relative z-10">
            <Badge variant="warning" size="sm" className="bg-amber-500/20 text-amber-300 border-amber-500/40">
              <Tag className="w-3 h-3" />
              <span>Marketplace Deals</span>
            </Badge>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Special Offers
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Compare offers across trusted sellers and apply eligible coupon codes during checkout for verified savings.
            </p>
          </div>
          <div className="relative z-10">
            <Link to="/products?sortBy=PRICE_ASC">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Shop Now
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* 6. Featured Manufacturer Brands (Preserved Existing Section) */}
      {brands.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Popular Manufacturer Brands
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <span>Explore Brands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {brands.map((brand) => (
              <Link
                key={brand._id}
                to={`/products?brand=${encodeURIComponent(brand.slug)}`}
                className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-9 h-9 rounded bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-600">
                  {brand.name}
                </span>
                {brand.countryOfOrigin && (
                  <span className="text-[10px] text-slate-400 mt-0.5">{brand.countryOfOrigin}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sell on AutoDock Banner (Preserved Existing Section) */}
      <Card
        variant="dark"
        padding="md"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Sell Spare Parts on AutoDock</h3>
          <p className="text-xs text-slate-400 mt-1">
            Reach vehicle owners and repair workshops across all 25 districts.
          </p>
        </div>
        <Link to="/sellers/register" className="shrink-0">
          <Button variant="primary" size="md">
            Become a Seller
          </Button>
        </Link>
      </Card>
    </div>
  );
};
