import React, { useState, useEffect } from 'react';
import { Tags, Plus, Edit3, FolderTree, Award } from 'lucide-react';
import {
  CategoryItem,
  BrandItem,
  taxonomyApi,
} from '../../api/customerExperienceApi.js';
import { CategoryModal } from '../../components/CategoryModal.js';
import { BrandModal } from '../../components/BrandModal.js';
import {
  Alert,
  Badge,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminCataloguePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'BRANDS'>('CATEGORIES');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);

  const loadTaxonomy = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [catRes, brandRes] = await Promise.all([
        taxonomyApi.getCategories(),
        taxonomyApi.getBrands(),
      ]);
      if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (brandRes.success && Array.isArray(brandRes.data)) setBrands(brandRes.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load catalog taxonomy.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTaxonomy();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue Taxonomy"
        subtitle="Manage marketplace spare-part categories and supported manufacturer brands"
        actions={
          activeTab === 'CATEGORIES' ? (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
            >
              Add Category
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingBrand(null);
                setBrandModalOpen(true);
              }}
            >
              Add Brand
            </Button>
          )
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Tab Switcher */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'CATEGORIES'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Part Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BRANDS')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'BRANDS'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Manufacturer Brands</span>
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : activeTab === 'CATEGORIES' ? (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Hierarchy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No categories configured yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const parent = cat.parentId
                      ? categories.find((c) => c._id === cat.parentId)?.name || 'Sub-category'
                      : 'Top-Level';
                    return (
                      <tr key={cat._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {cat.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-600">
                          {cat.slug}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{parent}</td>
                        <td className="py-3 px-4">
                          <Badge variant={cat.isActive ? 'success' : 'default'}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Brand Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No manufacturer brands configured yet.
                    </td>
                  </tr>
                ) : (
                  brands.map((brand) => (
                    <tr key={brand._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          <Tags className="w-3.5 h-3.5 text-slate-400" />
                          {brand.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {brand.slug}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {brand.countryOfOrigin || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={brand.isActive ? 'success' : 'default'}>
                          {brand.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setEditingBrand(brand);
                            setBrandModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CategoryModal
        category={editingCategory}
        parentCategories={categories}
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={loadTaxonomy}
      />

      <BrandModal
        brand={editingBrand}
        isOpen={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        onSuccess={loadTaxonomy}
      />
    </div>
  );
};
