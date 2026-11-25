import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import {
  productsApi,
  garageApi,
  cartApi,
  wishlistApi,
  ProductItem,
  ProductReview,
  GarageVehicle,
  CompatibilityCheckResult,
} from '../api/customerExperienceApi.js';
import { ProductImageGallery } from '../components/ProductImageGallery.js';
import { FitmentAlertBanner } from '../components/FitmentAlertBanner.js';
import { SpecsTable } from '../components/SpecsTable.js';
import { AddToCartBox } from '../components/AddToCartBox.js';
import { WriteReviewModal } from '../components/WriteReviewModal.js';
import { ProductCard } from '../components/ProductCard.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import { Alert, Badge, Button, Select } from '../../../shared/components/index.js';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [recommendations, setRecommendations] = useState<ProductItem[]>([]);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [fitmentResult, setFitmentResult] = useState<CompatibilityCheckResult | null>(null);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProductData = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [prodRes, revRes, recRes] = await Promise.all([
        productsApi.getById(id),
        productsApi.getReviews(id, { limit: 10 }),
        productsApi.getRecommendations({ productId: id, limit: 4 }),
      ]);

      if (prodRes.success && prodRes.data) setProduct(prodRes.data);
      if (revRes.success && revRes.data) setReviews(revRes.data.items || []);
      if (recRes.success && Array.isArray(recRes.data)) setRecommendations(recRes.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load product details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductData();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    garageApi
      .getVehicles()
      .then((res) => {
        if (res.success && res.data?.vehicles?.length) {
          setGarageVehicles(res.data.vehicles);
          const def = res.data.vehicles.find((v) => v.isDefault) || res.data.vehicles[0];
          setSelectedVehicleId(def._id);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const activeVehicle = garageVehicles.find((v) => v._id === selectedVehicleId);

  useEffect(() => {
    if (!id || !activeVehicle || product?.isUniversalFit) {
      setFitmentResult(null);
      return;
    }
    productsApi
      .checkFitment(id, {
        make: activeVehicle.make,
        model: activeVehicle.model,
        year: activeVehicle.year,
      })
      .then((res) => {
        if (res.success && res.data) setFitmentResult(res.data);
      })
      .catch(() => setFitmentResult(null));
  }, [id, activeVehicle, product?.isUniversalFit]);

  const handleAddToCart = async (quantity: number) => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await cartApi.addItem({ productId: product._id, quantity });
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      await wishlistApi.removeItem(product._id);
      setIsWishlisted(false);
    } else {
      await wishlistApi.addItem(product._id);
      setIsWishlisted(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 h-96 bg-white border border-slate-200 rounded-lg" />
          <div className="lg:col-span-7 h-96 bg-white border border-slate-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (errorMessage || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Alert variant="danger" title="Part not found">
          {errorMessage || 'The requested product is no longer available.'}
        </Alert>
        <Link to="/products">
          <Button variant="outline">Back to Parts Catalog</Button>
        </Link>
      </div>
    );
  }

  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : 'OEM / Generic';

  const categoryName =
    typeof product.categoryId === 'object' && product.categoryId !== null
      ? product.categoryId.name
      : 'Spare Parts';

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link to="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <Link to="/products" className="hover:text-slate-900">
            Parts Catalog
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className="text-slate-900 font-medium">{categoryName}</span>
        </nav>

        {/* Main 2-column Detail View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Media, Title, Fitment, Description, Specs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-6">
                  <ProductImageGallery
                    images={product.images || []}
                    productName={product.name}
                  />
                </div>

                <div className="md:col-span-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">{brandName}</Badge>
                    <Badge variant="primary">{product.condition}</Badge>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-semibold text-slate-900">
                        {product.averageRating ? product.averageRating.toFixed(1) : 'New'}
                      </span>
                      <span>({product.reviewCount} reviews)</span>
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      SKU: {product.sku}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    {product.description}
                  </p>
                </div>
              </div>

              {/* Fitment Check */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                {garageVehicles.length > 0 && !product.isUniversalFit && (
                  <div className="max-w-xs">
                    <Select
                      label="Check fitment for saved vehicle"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      options={garageVehicles.map((v) => ({
                        value: v._id,
                        label: `${v.year} ${v.make} ${v.model}`,
                      }))}
                    />
                  </div>
                )}

                <FitmentAlertBanner
                  status={fitmentResult?.status}
                  vehicleName={
                    activeVehicle
                      ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}`
                      : undefined
                  }
                  notes={fitmentResult?.notes}
                  isUniversalFit={product.isUniversalFit}
                />
              </div>
            </div>

            <SpecsTable product={product} />

            {/* Customer Reviews */}
            <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Customer Reviews ({reviews.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verified buyer feedback on fitment and quality
                  </p>
                </div>
                {isAuthenticated && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    onClick={() => setIsReviewModalOpen(true)}
                  >
                    Write a Review
                  </Button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No customer reviews yet for this part.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {reviews.map((rev) => {
                    const reviewer =
                      typeof rev.userId === 'object' && rev.userId
                        ? `${rev.userId.firstName} ${rev.userId.lastName}`
                        : 'Verified Customer';
                    return (
                      <div key={rev._id} className="p-5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-semibold text-slate-900">
                              {reviewer}
                            </span>
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified Purchase</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                            <span className="ml-2">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right: Sticky Purchase Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <AddToCartBox
              product={product}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={isWishlisted}
            />
          </div>
        </div>

        {/* Related Parts */}
        {recommendations.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Related Spare Parts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {recommendations.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <WriteReviewModal
        productId={product._id}
        productName={product.name}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={loadProductData}
      />
    </div>
  );
};
