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
  Sparkles,
  Layers,
  Building2,
  Zap,
  Disc,
  Droplets,
  Settings,
  Flame,
  ShieldAlert,
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
    if (!slug) return <Wrench className="w-6 h-6" />;
    if (slug.includes('brake') || slug.includes('suspension')) return <Disc className="w-6 h-6" />;
    if (slug.includes('engine') || slug.includes('drivetrain')) return <Flame className="w-6 h-6" />;
    if (slug.includes('filter') || slug.includes('fluid')) return <Droplets className="w-6 h-6" />;
    if (slug.includes('electrical') || slug.includes('light')) return <Zap className="w-6 h-6" />;
    if (slug.includes('transmission')) return <Settings className="w-6 h-6" />;
    return <Wrench className="w-6 h-6" />;
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#070b13] via-[#0d1424] to-[#0a192f] text-white rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-14 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-semibold mb-5 border border-blue-500/30 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Sri Lanka's Verified Vehicle Spare-Parts Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4">
            Find the Exact Spare Part <br className="hidden sm:block" />
            for Your Exact Vehicle.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-xl leading-relaxed font-normal">
            Eliminate wrong fitments. Search thousands of OEM and aftermarket parts verified by Sri Lankan vehicle merchants and vetted physical stores across 25 districts.
          </p>

          {/* Precision Vehicle Quick Finder Card */}
          <div className="bg-[#111827]/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-white/15 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-blue-300">
                <Car className="w-4 h-4 text-blue-400" />
                <span>Select Your Vehicle for Guaranteed Fitment</span>
              </div>
              <Link
                to="/garage"
                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Open My Garage</span>
              </Link>
            </div>

            <form onSubmit={handleVehicleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="bg-[#0b0f19] border border-slate-700/80 text-white rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer shadow-inner"
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
                className="bg-[#0b0f19] border border-slate-700/80 text-white rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 font-medium cursor-pointer shadow-inner"
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
                className="bg-[#0b0f19] border border-slate-700/80 text-white placeholder-slate-400 rounded-xl text-xs px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-inner"
              />

              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 text-white text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Search className="w-4 h-4" />
                <span>Find Matching Parts</span>
              </button>
            </form>

            {/* Quick search tags */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Popular:</span>
              {popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition font-medium border border-slate-700/70 shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Value Prop */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Guaranteed Fitment</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Strict compatibility engine maps genuine parts to vehicle chassis and engine trims.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition duration-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Vetted Local Merchants</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              BR-registered physical spare-parts stores verified by in-person inspection or video check.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 group-hover:bg-amber-600 group-hover:text-white transition duration-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Island-wide Delivery</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Transparent per-seller courier rates across all 25 administrative districts in Sri Lanka.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-start gap-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 group-hover:bg-purple-600 group-hover:text-white transition duration-200">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Direct Bank Settlement</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Direct transfer to verified merchant bank accounts with uploadable proof of payment.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Spare Parts Section */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Recommended Spare Parts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on popular demand, vehicle fitment affinity, and vetted vendor stock.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group self-start sm:self-auto py-1.5 px-3 rounded-lg hover:bg-blue-50 transition"
          >
            <span>View Full Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 h-80 animate-pulse flex flex-col justify-between shadow-xs">
                <div className="bg-slate-200 aspect-video rounded-xl w-full" />
                <div className="space-y-2 py-3">
                  <div className="bg-slate-200 h-3 w-1/3 rounded" />
                  <div className="bg-slate-200 h-4 w-3/4 rounded" />
                </div>
                <div className="bg-slate-200 h-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 shadow-xs">
            No products currently featured. Visit the catalogue to explore all listings.
          </div>
        )}
      </section>

      {/* Browse by Category */}
      {categories.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Organized Catalogue</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Browse by Category</h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>All Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.slug}`}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center group flex flex-col items-center justify-center min-h-[130px]"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                  {getCategoryIcon(cat.slug)}
                </div>
                <h3 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition leading-snug">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why AutoDock Comparison Section */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            The AutoDock Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Buy Spare Parts on AutoDock?
          </h2>
          <p className="text-xs text-slate-500">
            Traditional spare part hunting in Sri Lanka is prone to mismatch, counterfeit parts, and unpredictable pricing. We solve this end-to-end.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Traditional Way */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>Traditional Offline Hunting</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✕</span>
                <span>Calling or traveling across multiple shops in Panchikawatta with no stock guarantee.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✕</span>
                <span>Frequent wrong fitments due to unverified engine trim and chassis compatibility.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✕</span>
                <span>Uncertain merchant reputation with lack of verified customer purchase reviews.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✕</span>
                <span>Arbitrary courier charges and lack of tracking transparency across districts.</span>
              </li>
            </ul>
          </div>

          {/* AutoDock Experience */}
          <div className="p-6 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50 rounded-2xl border border-blue-200/90 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>The AutoDock Platform Standard</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✓</span>
                <span><strong>1-Click My Garage:</strong> Save up to 10 vehicles and filter only guaranteed matching parts.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✓</span>
                <span><strong>Vetted Merchants:</strong> Physical stores verified via in-person visits or live video checks.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✓</span>
                <span><strong>Multi-Vendor Checkout:</strong> Independent seller suborders with clear courier rates per district.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0 text-[10px]">✓</span>
                <span><strong>Direct Bank & COD:</strong> Direct bank account payments with digital receipt verification.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Manufacturer Brands */}
      {brands.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Genuine & OEM</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Popular Manufacturer Brands</h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Explore Brands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {brands.map((brand) => (
              <Link
                key={brand._id}
                to={`/products?brand=${brand.slug}`}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center text-center group"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition duration-200">
                  <Award className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-slate-800 group-hover:text-amber-700">
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
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Building2 className="w-80 h-80 text-white" />
        </div>
        <div className="space-y-2 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold border border-white/20 mb-1">
            <Building2 className="w-3.5 h-3.5 text-blue-300" />
            <span>Merchant Growth Program</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Own a Vehicle Spare-Parts Store in Sri Lanka?</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Register your physical shop or online enterprise to sell parts directly to thousands of vehicle owners and repair garages across the island with zero upfront setup fees.
          </p>
        </div>
        <Link
          to="/sellers/register"
          className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xl shadow-blue-500/25 active:scale-95 relative z-10"
        >
          Register as Merchant
        </Link>
      </section>
    </div>
  );
};
