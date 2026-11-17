import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ProductReview, sellerProductsApi } from '../../api/customerExperienceApi.js';

export const SellerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await sellerProductsApi.getReviews({ limit: 50 });
        if (response.success && response.data?.items) {
          setReviews(response.data.items);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Unable to retrieve product reviews.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="p-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Customer Feedback & Reviews</h1>
            <p className="text-xs text-slate-500">
              Verified customer ratings on spare parts sold through your merchant store.
            </p>
          </div>
        </div>
      </div>

      {/* Transparency Policy Banner */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900">
            Marketplace Transparency Notice (Read-Only Access)
          </div>
          <p className="text-slate-500 leading-relaxed">
            In accordance with AutoDock business rule <strong>FR-PROD-010</strong>, customer reviews are published immediately after verified-purchase check and are read-only for sellers. Merchants cannot modify, delete, or hide customer ratings. If you suspect abuse or policy violation, please report the review ID to AutoDock administration.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading customer reviews...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Spare Part</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Customer Comment</th>
                  <th className="px-4 py-3.5">Reviewer</th>
                  <th className="px-4 py-3.5">Purchase Verified</th>
                  <th className="px-4 py-3.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reviews.map((rev) => {
                  const prod =
                    typeof rev.productId === 'object' && rev.productId !== null
                      ? rev.productId
                      : { name: 'Part ID: ' + rev.productId, sku: '' };

                  const reviewerName =
                    typeof rev.userId === 'object' && rev.userId !== null
                      ? `${(rev.userId as any).firstName} ${(rev.userId as any).lastName?.charAt(0) || ''}.`
                      : 'Verified Customer';

                  return (
                    <tr key={rev._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs truncate">
                        {prod.name}
                        {prod.sku && (
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
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
                      </td>

                      <td className="px-5 py-3.5 max-w-sm text-slate-700 leading-relaxed">
                        {rev.comment}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">{reviewerName}</td>

                      <td className="px-4 py-3.5">
                        {rev.isVerifiedPurchase ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Standard</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Customer Reviews Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When customers complete orders and receive their deliveries, their published ratings will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
