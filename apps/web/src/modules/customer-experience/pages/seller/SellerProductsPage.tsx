import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit3,
  Sliders,
  Trash2,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  ProductItem,
  sellerProductsApi,
} from '../../api/customerExperienceApi.js';
import { sellerApi, SellerProfileData } from '../../../identity/api/identityApi.js';
import { StockQuickEditModal } from '../../components/StockQuickEditModal.js';
import { formatLKR } from '../../utils/formatters.js';

export const SellerProductsPage: React.FC = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingStockProduct, setEditingStockProduct] = useState<ProductItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [profileRes, prodRes] = await Promise.allSettled([
        sellerApi.getMe(),
        sellerProductsApi.list({ limit: 50 }),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.success) {
        setSellerProfile(profileRes.value.data);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.success) {
        setProducts(prodRes.value.data.items || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load seller catalogue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isEligibleToSell =
    sellerProfile?.verificationStatus === 'APPROVED' && sellerProfile?.isEligibleToSell;

  const handleToggleStatus = async (product: ProductItem) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await sellerProductsApi.updateStatus(product._id, nextStatus);
      if (res.success) {
        setActionSuccess(`Product status changed to ${nextStatus}.`);
        setTimeout(() => setActionSuccess(null), 3000);
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to toggle product status.');
    }
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    if (!window.confirm(`Are you sure you want to deactivate and remove '${product.name}'?`)) {
      return;
    }
    try {
      const res = await sellerProductsApi.delete(product._id);
      if (res.success) {
        setActionSuccess('Product removed from active catalogue.');
        setTimeout(() => setActionSuccess(null), 3000);
        loadData();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete product.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header & Metrics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Merchant Store</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border ${
                isEligibleToSell
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Status: {sellerProfile?.verificationStatus || 'PENDING'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store's listed spare parts, stock levels, and vehicle fitment compatibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/reviews"
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
          >
            Customer Reviews
          </Link>
          <button
            type="button"
            disabled={!isEligibleToSell}
            onClick={() => navigate('/seller/products/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Part</span>
          </button>
        </div>
      </div>

      {/* Gating Banner (When seller not approved) */}
      {!isEligibleToSell && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950">
              Product Listing Restricted — Seller Account Under Review
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              In accordance with AutoDock anti-counterfeit spare-parts regulations, catalog publication unlocks once administrative verification of your physical shop or online enterprise documents is complete.
            </p>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading inventory records...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Spare Part</th>
                  <th className="px-4 py-3.5">SKU / Code</th>
                  <th className="px-4 py-3.5">Price (LKR)</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Condition</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map((p) => {
                  const thumb =
                    p.images?.find((i) => i.isPrimary)?.url ||
                    p.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=200&q=80';

                  const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {typeof p.brandId === 'object' && p.brandId ? p.brandId.name : 'Generic'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-600">{p.sku}</td>

                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatLKR(p.priceInCents)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              p.stock === 0
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingStockProduct(p)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Quick Stock Adjustment"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.condition}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="flex items-center gap-1.5 font-semibold text-[11px]"
                          title="Click to toggle status"
                        >
                          {p.status === 'ACTIVE' ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                              <span className="text-emerald-700">Active</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                              <span className="text-slate-500">Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/seller/products/${p._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit product details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="font-bold text-slate-900 text-base mb-1">No Products Listed Yet</h3>
              <p className="text-xs text-slate-500">
                Begin listing your spare-parts inventory to reach customers looking for exact vehicle fits.
              </p>
            </div>
            {isEligibleToSell && (
              <button
                type="button"
                onClick={() => navigate('/seller/products/new')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Product Listing</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stock Edit Modal */}
      <StockQuickEditModal
        product={editingStockProduct}
        isOpen={Boolean(editingStockProduct)}
        onClose={() => setEditingStockProduct(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
