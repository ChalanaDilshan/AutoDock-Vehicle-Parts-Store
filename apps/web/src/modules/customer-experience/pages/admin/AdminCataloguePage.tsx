import React, { useState, useEffect } from 'react';
import {
  Layers,
  Award,
  Plus,
  Edit2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  CategoryItem,
  BrandItem,
  taxonomyApi,
} from '../../api/customerExperienceApi.js';
import { CategoryModal } from '../../components/CategoryModal.js';
import { BrandModal } from '../../components/BrandModal.js';

export const AdminCataloguePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'BRANDS'>('CATEGORIES');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [catRes, brandRes] = await Promise.allSettled([
        taxonomyApi.getCategories(),
        taxonomyApi.getBrands(),
      ]);

      if (catRes.status === 'fulfilled' && catRes.value.success) {
        setCategories(catRes.value.data || []);
      }
      if (brandRes.status === 'fulfilled' && brandRes.value.success) {
        setBrands(brandRes.value.data || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load catalogue taxonomies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Admin Platform
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Taxonomy Manager
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Catalogue Categories & Brands</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure vehicle spare-part hierarchies, manufacturer brands, and public browsing taxonomies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'CATEGORIES' ? (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingBrand(null);
                setIsBrandModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Brand</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'CATEGORIES'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Part Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BRANDS')}
          className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'BRANDS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Manufacturer Brands ({brands.length})</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Categories Tab Content */}
      {activeTab === 'CATEGORIES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading categories...</p>
            </div>
          ) : categories.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Category Name</th>
                    <th className="px-4 py-3.5">Slug</th>
                    <th className="px-4 py-3.5">Parent Level</th>
                    <th className="px-4 py-3.5">Display Order</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {categories.map((c) => {
                    const parent = categories.find((p) => p._id === c.parentId);

                    return (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {c.name}
                          {c.description && (
                            <span className="block text-[11px] font-normal text-slate-400 truncate max-w-xs">
                              {c.description}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{c.slug}</td>
                        <td className="px-4 py-3.5">
                          {parent ? (
                            <span className="font-semibold text-slate-700">{parent.name}</span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Top-Level
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600">{c.displayOrder}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              c.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(c);
                              setIsCategoryModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500">
              No categories created yet. Click "Add Category" to initialize the taxonomy.
            </div>
          )}
        </div>
      )}

      {/* Brands Tab Content */}
      {activeTab === 'BRANDS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading manufacturer brands...</p>
            </div>
          ) : brands.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Brand</th>
                    <th className="px-4 py-3.5">Slug</th>
                    <th className="px-4 py-3.5">Country of Origin</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {brands.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {b.logoUrl ? (
                            <img
                              src={b.logoUrl}
                              alt={b.name}
                              className="w-8 h-8 object-contain rounded border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
                              <Award className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-bold text-slate-900">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-600">{b.slug}</td>
                      <td className="px-4 py-3.5 text-slate-700">{b.countryOfOrigin || 'International'}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            b.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrand(b);
                            setIsBrandModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Brand"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center text-xs text-slate-500">
              No manufacturer brands registered yet.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        category={editingCategory}
        parentCategories={categories}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={loadData}
      />

      <BrandModal
        brand={editingBrand}
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
