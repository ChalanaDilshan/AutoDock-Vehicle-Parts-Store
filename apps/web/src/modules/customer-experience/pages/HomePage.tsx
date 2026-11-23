import React, { useState, useEffect } from 'react';
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
  XCircle,
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
import { useAuth } from '../../identity/context/AuthContext.js';

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
        }
        if (catRes.status === 'fulfilled' && catRes.value.success) {
          setCategories(catRes.value.data || []);
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
        .catch(() => {});
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
    await cartApi.addItem({ productId: product._id, quantity: 1 });
  };

  const handleToggleWishlist = async (product: ProductItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await wishlistApi.addItem(product._id);
  };

  // Helper icon selector for category types
  const getCategoryIcon = (slug?: string) => {
    if (!slug) return <Wrench className="w-5 h-5" />;
    if (slug.includes('brake') || slug.includes('suspension')) return <Disc className="w-5 h-5 text-blue-600" />;
    if (slug.includes('engine') || slug.includes('drivetrain')) return <Flame className="w-5 h-5 text-amber-600" />;
    if (slug.includes('filter') || slug.includes('fluid')) return <Droplets className="w-5 h-5 text-teal-600" />;
    if (slug.includes('electrical') || slug.includes('light')) return <Zap className="w-5 h-5 text-indigo-600" />;
    if (slug.includes('transmission')) return <Settings className="w-5 h-5 text-slate-700" />;
    return <Wrench className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-12">
      {/* Hero Section & Practical Vehicle Selector */}
      <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-10 border border-slate-800 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-medium mb-3">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Sri Lanka's Verified Vehicle Spare-Parts Marketplace</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
            Find the Exact Spare Part for Your Vehicle.
          </h1>

          <p className="text-sm text-slate-300 mb-6 max-w-xl leading-relaxed">
            Eliminate wrong fitments. Search thousands of OEM and aftermarket parts verified by Sri Lankan vehicle merchants and vetted physical stores across 25 districts.
          </p>

          {/* Vehicle Quick Finder Box */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Car className="w-4 h-4 text-blue-400" />
                <span>Select Your Vehicle for Guaranteed Fitment</span>
              </div>
              <Link
                to="/garage"
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Open My Garage</span>
              </Link>
            </div>

            <form onSubmit={handleVehicleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="bg-slate-900 border border-slate-700 text-white rounded-md text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              >
                <option value="">1. Select Make</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedModel}
                disabled={!selectedMake}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-md text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-40 font-medium"
              >
                <option value="">2. Select Model</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="3. Year (e.g. 2018)"
                min={1960}
                max={2035}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white placeholder-slate-400 rounded-md text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-md transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Find Matching Parts</span>
              </button>
            </form>

            {/* Quick search tags */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400">Popular:</span>
              {popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-800 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Guaranteed Fitment</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Compatibility engine maps genuine parts to vehicle chassis and engine trims.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Vetted Local Merchants</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              BR-registered physical spare-parts stores verified by in-person inspection.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Island-wide Delivery</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Transparent per-seller courier rates across all 25 districts in Sri Lanka.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 flex items-start gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md shrink-0">
            <RotateCcw className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-900">Direct Bank Settlement</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Direct transfer to verified merchant bank accounts with uploadable proof of payment.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Spare Parts Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Recommended Spare Parts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on popular demand, vehicle fitment affinity, and vetted vendor stock.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 group py-1"
          >
            <span>View Full Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
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
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
            No products currently featured. Visit the catalogue to explore all listings.
          </div>
        )}
      </section>

      {/* Browse by Category */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Browse by Category</h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="bg-white p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition text-center group flex flex-col items-center justify-center min-h-[110px]"
              >
                <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                  {getCategoryIcon(cat.slug)}
                </div>
                <h3 className="font-medium text-xs text-slate-800 group-hover:text-blue-600 transition leading-snug">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why AutoDock Comparison Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="max-w-xl space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Why Buy Spare Parts on AutoDock?
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Traditional spare part hunting in Sri Lanka is prone to mismatch, counterfeit parts, and unpredictable pricing. We solve this end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Traditional Sourcing */}
          <div className="p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="font-semibold text-xs uppercase tracking-wider text-slate-600">
              Traditional Offline Sourcing
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Calling or traveling across multiple shops in Panchikawatta with no stock guarantee.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Frequent wrong fitments due to unverified engine trim and chassis compatibility.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Uncertain merchant reputation with lack of verified customer purchase reviews.</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>Arbitrary courier charges and lack of tracking transparency across districts.</span>
              </li>
            </ul>
          </div>

          {/* AutoDock Standard */}
          <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-200 space-y-3">
            <div className="font-semibold text-xs uppercase tracking-wider text-blue-900">
              The AutoDock Platform Standard
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>1-Click My Garage:</strong> Save up to 10 vehicles and filter only guaranteed matching parts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Vetted Merchants:</strong> Physical stores verified via in-person visits and business registration.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Multi-Vendor Checkout:</strong> Independent seller suborders with clear courier rates per district.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span><strong>Direct Bank & COD:</strong> Direct bank account payments with digital receipt verification.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Manufacturer Brands */}
      {brands.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Popular Manufacturer Brands</h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Explore Brands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {brands.map((brand) => (
              <Link
                key={brand._id}
                to={`/products?brand=${brand.slug}`}
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

      {/* Sell on AutoDock Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
            Merchant Growth Program
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Own a Vehicle Spare-Parts Store in Sri Lanka?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Register your physical shop or online enterprise to sell parts directly to thousands of vehicle owners and repair garages across the island with zero upfront setup fees.
          </p>
        </div>
        <Link
          to="/sellers/register"
          className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition"
        >
          Register as Merchant
        </Link>
      </section>
    </div>
  );
};
