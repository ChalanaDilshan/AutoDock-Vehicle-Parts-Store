import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, MessageSquare } from 'lucide-react';
import {
  ProductReview,
  sellerProductsApi,
} from '../../api/customerExperienceApi.js';
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    sellerProductsApi
      .getReviews({ limit: 50 })
      .then((res) => {
        if (res.success && res.data) {
          setReviews(res.data.items || []);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load customer reviews.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Customer Product Reviews"
        subtitle="View verified buyer feedback on parts you have sold"
        backTo="/seller/dashboard"
        backLabel="Seller Portal"
      />

      <Alert variant="info" title="Marketplace Transparency Notice (Read-Only Access)">
        Sellers can read all buyer reviews for their listed parts. Reviews can only be moderated by platform administrators to protect rating integrity.
      </Alert>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="No reviews received yet"
          description="Verified customer reviews on your delivered spare parts will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {reviews.map((rev) => {
            const productName =
              typeof rev.productId === 'object' && rev.productId
                ? rev.productId.name
                : 'Spare Part';
            const reviewer =
              typeof rev.userId === 'object' && rev.userId
                ? `${rev.userId.firstName} ${rev.userId.lastName}`
                : 'Verified Customer';
            return (
              <div key={rev._id} className="p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {productName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      By {reviewer} &middot; {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
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
                    </div>
                    {rev.isVerifiedPurchase && (
                      <Badge variant="success">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Purchase</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
