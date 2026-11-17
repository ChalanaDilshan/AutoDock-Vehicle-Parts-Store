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
      taxonomyApi.getModels(selectedMake).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setModels(res.data);
        }
      }).catch(() => {});
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
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl overflow-hidden p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-4 border border-blue-500/30">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Sri Lanka's Verified Vehicle Spare-Parts Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Find the Exact Spare Part <br className="hidden sm:block" />
            for Your Exact Vehicle.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mb-8 max-w-xl leading-relaxed">
            Eliminate wrong fitments. Search thousands of OEM and aftermarket parts verified by Sri Lankan vehicle merchants and vetted physical stores across 25 districts.
          </p>

          {/* Vehicle Quick Finder Card */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-blue-300">
              <Car className="w-4 h-4" />
              <span>Select Your Vehicle for Guaranteed Fitment</span>
            </div>

            <form onSubmit={handleVehicleSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={selectedMake}
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                }}
                className="bg-slate-900/90 border border-slate-700 text-white rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="bg-slate-900/90 border border-slate-700 text-white rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                className="bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Find Matching Parts</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Value Prop */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Guaranteed Fitment</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict compatibility database mapping parts to vehicle chassis and engine trims.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Vetted Local Merchants</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              BR-registered physical spare-parts stores verified by in-person inspection or WhatsApp call.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Island-wide Delivery</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent per-seller courier rates across all 25 districts in Sri Lanka.
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Direct Bank Settlement</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct transfer to verified merchant bank accounts with uploadable proof of payment.
            </p>
          </div>
        </div>
      </section>

      {/* Recommended Spare Parts Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Recommended Spare Parts
            </h2>
            <p className="text-xs text-slate-500">
              Based on popular demand, vehicle fitment affinity, and vetted vendor stock.
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 group"
          >
            <span>View Full Catalogue</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-slate-100 rounded-xl aspect-3/4 animate-pulse" />
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
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            No products currently featured. Visit the catalogue to explore all listings.
          </div>
        )}
      </section>

      {/* Browse by Category */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Browse by Category</h2>
            <Link
              to="/products"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
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
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-sm transition text-center group flex flex-col items-center justify-center min-h-[100px]"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition">
                  {cat.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Manufacturer Brands */}
      {brands.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Popular Manufacturer Brands</h2>
            <Link
              to="/products"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
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
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-sm transition flex flex-col items-center justify-center text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-600">
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
      <section className="bg-blue-600 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl font-black">Own a Vehicle Spare-Parts Store in Sri Lanka?</h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Register your physical shop or online enterprise to sell parts directly to thousands of vehicle owners and repair garages across the island.
          </p>
        </div>
        <Link
          to="/sellers/register"
          className="shrink-0 px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition shadow-md active:scale-95"
        >
          Register as Merchant
        </Link>
      </section>
    </div>
  );
};
