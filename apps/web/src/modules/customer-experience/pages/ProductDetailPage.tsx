import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ChevronRight,
  Store,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  ProductItem,
  ProductReview,
  FitmentStatus,
  GarageVehicle,
  productsApi,
  garageApi,
  cartApi,
  wishlistApi,
} from '../api/customerExperienceApi.js';
import { ProductImageGallery } from '../components/ProductImageGallery.js';
import { FitmentAlertBanner } from '../components/FitmentAlertBanner.js';
import { SpecsTable } from '../components/SpecsTable.js';
import { AddToCartBox } from '../components/AddToCartBox.js';
import { WriteReviewModal } from '../components/WriteReviewModal.js';
import { ProductCard } from '../components/ProductCard.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [recommended, setRecommended] = useState<ProductItem[]>([]);
  const [activeGarageVehicle, setActiveGarageVehicle] = useState<GarageVehicle | null>(null);
  const [fitmentStatus, setFitmentStatus] = useState<FitmentStatus | undefined>(undefined);
  const [fitmentNotes, setFitmentNotes] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadProductData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const prodRes = await productsApi.getById(id);
        if (prodRes.success && prodRes.data) {
          setProduct(prodRes.data);

          // Concurrently load reviews and recommendations
          productsApi.getReviews(id).then((r) => {
            if (r.success && r.data?.items) setReviews(r.data.items);
          }).catch(() => {});

          productsApi.getRecommendations({ productId: id, limit: 4 }).then((rec) => {
            if (rec.success && Array.isArray(rec.data)) setRecommended(rec.data);
          }).catch(() => {});

          // If authenticated, check fitment against default garage vehicle
          if (isAuthenticated) {
            garageApi.getVehicles().then(async (gRes) => {
              if (gRes.success && gRes.data?.vehicles?.length > 0) {
                const defaultVeh =
                  gRes.data.vehicles.find((v) => v.isDefault) || gRes.data.vehicles[0];
                setActiveGarageVehicle(defaultVeh);

                try {
                  const fitRes = await productsApi.checkFitment(id, {
                    make: defaultVeh.make,
                    model: defaultVeh.model,
                    year: defaultVeh.year,
                    submodel: defaultVeh.submodel,
                  });
                  if (fitRes.success && fitRes.data) {
                    setFitmentStatus(fitRes.data.status);
                    setFitmentNotes(fitRes.data.notes);
                  }
                } catch {
                  // Fitment check silent fallback
                }
              }
            }).catch(() => {});
          }
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Product not found or currently unavailable.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [id, isAuthenticated]);

  const handleAddToCart = async (quantity: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product) {
      await cartApi.addItem({ productId: product._id, quantity });
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product) {
      if (isWishlisted) {
        await wishlistApi.removeItem(product._id);
        setIsWishlisted(false);
      } else {
        await wishlistApi.addItem(product._id);
        setIsWishlisted(true);
      }
    }
  };

  const refreshReviews = () => {
    if (id) {
      productsApi.getReviews(id).then((r) => {
        if (r.success && r.data?.items) setReviews(r.data.items);
      });
      // also re-fetch product to get updated averageRating
      productsApi.getById(id).then((p) => {
        if (p.success && p.data) setProduct(p.data);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm font-medium">Loading spare part details...</p>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="max-w-lg mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Product Unavailable</h2>
        <p className="text-xs text-slate-500">{errorMessage || 'The requested spare part does not exist.'}</p>
        <Link
          to="/products"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
        >
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const categoryName =
    typeof product.categoryId === 'object' && product.categoryId !== null
      ? product.categoryId.name
      : 'Parts';

  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : 'Generic';

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-blue-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-blue-600">Catalogue</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold">{categoryName}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-400 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid (Left: Gallery & Specs | Right: Buy Box & Fitment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Images, Fitment Banner, Specs, Reviews) */}
        <div className="lg:col-span-7 space-y-6">
          <ProductImageGallery images={product.images || []} productName={product.name} />

          {/* Vehicle Fitment Alert Banner */}
          <FitmentAlertBanner
            status={fitmentStatus}
            vehicleName={
              activeGarageVehicle
                ? `${activeGarageVehicle.year} ${activeGarageVehicle.make} ${activeGarageVehicle.model}`
                : undefined
            }
            notes={fitmentNotes}
            isUniversalFit={product.isUniversalFit}
          />

          {/* Description & Technical Specs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Product Description</h3>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          <SpecsTable product={product} />

          {/* Customer Reviews Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <span>Customer Reviews</span>
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 font-bold text-sm text-slate-900">
                      {product.averageRating > 0 ? product.averageRating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    based on {product.reviewCount} verified ratings
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setIsReviewModalOpen(true);
                  }
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition self-start sm:self-auto"
              >
                Write a Review
              </button>
            </div>

            {/* Review Cards List */}
            {reviews.length > 0 ? (
              <div className="divide-y divide-slate-100 space-y-4">
                {reviews.map((rev) => {
                  const authorName =
                    typeof rev.userId === 'object' && rev.userId !== null
                      ? `${(rev.userId as any).firstName} ${(rev.userId as any).lastName?.charAt(0) || ''}.`
                      : 'Verified Customer';

                  return (
                    <div key={rev._id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? 'fill-current text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{authorName}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                      {rev.images && rev.images.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          {rev.images.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt="Review attachment"
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No customer reviews yet for this part. Be the first verified buyer to leave feedback!
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Header, Store Card, Buy Box) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-bold text-blue-700 uppercase tracking-wider">{brandName}</span>
                <span className="font-mono text-slate-400">SKU: {product.sku}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {product.name}
              </h1>
            </div>

            {/* Seller Information Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sold & Shipped By</div>
                  <div className="font-bold text-slate-900">
                    {product.storeName || 'Verified AutoDock Merchant'}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Verified Store
              </span>
            </div>
          </div>

          {/* Add To Cart Box */}
          <AddToCartBox
            product={product}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={isWishlisted}
          />
        </div>
      </div>

      {/* Recommended Related Spare Parts */}
      {recommended.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Related Compatible Spare Parts</span>
            </h3>
            <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">
              Browse More Parts
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.map((item) => (
              <ProductCard
                key={item._id}
                product={item}
                onAddToCart={async (p) => {
                  if (!isAuthenticated) navigate('/login');
                  else await cartApi.addItem({ productId: p._id, quantity: 1 });
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={product._id}
        productName={product.name}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={refreshReviews}
      />
    </div>
  );
};
