import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Edit3,
  Power,
  Trash2,
  SlidersHorizontal,
  ShieldAlert,
} from 'lucide-react';
import {
  ProductItem,
  sellerProductsApi,
} from '../../api/customerExperienceApi.js';
import { sellerApi, SellerProfileData } from '../../../identity/api/identityApi.js';
import { StockQuickEditModal } from '../../components/StockQuickEditModal.js';
import { formatLKR } from '../../utils/formatters.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerProductsPage: React.FC = () => {
  const [sellerProfile, setSellerProfile] = useState<SellerProfileData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stockEditProduct, setStockEditProduct] = useState<ProductItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [meRes, prodRes] = await Promise.all([
        sellerApi.getMe().catch(() => null),
        sellerProductsApi.list({
          status: statusFilter || undefined,
          limit: 50,
        }),
      ]);

      if (meRes?.success && meRes.data) setSellerProfile(meRes.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data.items || []);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleToggleStatus = async (p: ProductItem) => {
    try {
      const next = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await sellerProductsApi.updateStatus(p._id, next);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update product status.');
    }
  };

  const handleDelete = async (p: ProductItem) => {
    if (!window.confirm(`Delete "${p.name}" from your catalog?`)) return;
    try {
      await sellerProductsApi.delete(p._id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete product.');
    }
  };

  const isEligible = sellerProfile?.isEligibleToSell ?? true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Merchant Inventory"
        subtitle={
          sellerProfile?.businessName
            ? `Manage spare parts published by ${sellerProfile.businessName}`
            : 'Manage your listed spare parts, stock levels, and pricing'
        }
        actions={
          isEligible && (
            <Link to="/seller/products/new">
              <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Add Spare Part
              </Button>
            </Link>
          )
        }
      />

      {!isEligible && (
        <Alert variant="warning" title="Verification Required">
          Your seller account must be approved before publishing live parts to customers.{' '}
          <Link to="/seller/onboarding" className="font-semibold underline">
            Complete Onboarding
          </Link>
        </Alert>
      )}

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '', label: 'All Parts' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          Showing {products.length} listings
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No spare parts listed yet"
          description="Add your first spare part with pricing, stock quantity, and vehicle compatibility."
          action={
            isEligible && (
              <Link to="/seller/products/new">
                <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Spare Part
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Part / SKU</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => {
                  const lowStock = p.stock <= (p.lowStockThreshold || 5);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="default">{p.condition}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatLKR(p.priceInCents)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              lowStock ? 'text-amber-700' : 'text-slate-800'
                            }`}
                          >
                            {p.stock} units
                          </span>
                          <button
                            type="button"
                            title="Quick Stock Adjustment"
                            aria-label="Quick Stock Adjustment"
                            onClick={() => setStockEditProduct(p)}
                            className="p-1 rounded border border-slate-200 text-slate-500 hover:text-[#E11D30] hover:border-red-300"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            p.status === 'ACTIVE'
                              ? 'success'
                              : p.status === 'OUT_OF_STOCK'
                                ? 'warning'
                                : 'default'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/seller/products/${p._id}/edit`}
                            title="Edit product"
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            title={p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-[#E11D30] hover:bg-red-50"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Delete product"
                            className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
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
        </div>
      )}

      {!isEligible && products.length === 0 && !isLoading && (
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Catalog publishing unlocks after admin approval.</span>
        </div>
      )}

      <StockQuickEditModal
        product={stockEditProduct}
        isOpen={Boolean(stockEditProduct)}
        onClose={() => setStockEditProduct(null)}
        onSuccess={loadData}
      />
    </div>
  );
};
