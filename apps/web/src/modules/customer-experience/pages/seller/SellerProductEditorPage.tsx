import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Car,
} from 'lucide-react';
import {
  ProductItem,
  CategoryItem,
  BrandItem,
  ProductCondition,
  sellerProductsApi,
  taxonomyApi,
} from '../../api/customerExperienceApi.js';
import { centsToRupees, rupeesToCents } from '../../utils/formatters.js';

export const SellerProductEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('NEW');
  const [priceRupees, setPriceRupees] = useState<number | string>('');
  const [stock, setStock] = useState<number | string>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | string>(3);
  const [warrantyMonths, setWarrantyMonths] = useState<number | string>(6);
  const [description, setDescription] = useState('');
  const [isUniversalFit, setIsUniversalFit] = useState(false);

  // Dynamic specs key-values
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);

  // Images list
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
  ]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // New compatibility entry
  const [compMake, setCompMake] = useState('');
  const [compModel, setCompModel] = useState('');
  const [compYearFrom, setCompYearFrom] = useState(2015);
  const [compYearTo, setCompYearTo] = useState(2022);
  const [compEngine, setCompEngine] = useState('');

  // Taxonomies
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    taxonomyApi.getCategories().then((r) => {
      if (r.success && Array.isArray(r.data)) setCategories(r.data);
    }).catch(() => {});

    taxonomyApi.getBrands().then((r) => {
      if (r.success && Array.isArray(r.data)) setBrands(r.data);
    }).catch(() => {});

    taxonomyApi.getMakes().then((r) => {
      if (r.success && Array.isArray(r.data)) setMakes(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (compMake) {
      taxonomyApi.getModels(compMake).then((r) => {
        if (r.success && Array.isArray(r.data)) setModels(r.data);
      }).catch(() => {});
    } else {
      setModels([]);
    }
  }, [compMake]);

  // Load existing product if editing
  useEffect(() => {
    if (isEditing && id) {
      setIsLoading(true);
      sellerProductsApi.getById(id)
        .then((res) => {
          if (res.success && res.data) {
            const p = res.data;
            setName(p.name);
            setSku(p.sku);
            setPartNumber(p.partNumber || '');
            setOemNumber(p.oemNumber || '');
            setCategoryId(typeof p.categoryId === 'object' && p.categoryId ? p.categoryId._id : (p.categoryId as string) || '');
            setBrandId(typeof p.brandId === 'object' && p.brandId ? p.brandId._id : (p.brandId as string) || '');
            setCondition(p.condition);
            setPriceRupees(centsToRupees(p.priceInCents));
            setStock(p.stock);
            setLowStockThreshold(p.lowStockThreshold || 3);
            setWarrantyMonths(p.warrantyMonths || 0);
            setDescription(p.description);
            setIsUniversalFit(p.isUniversalFit || false);

            if (p.specifications && Object.keys(p.specifications).length > 0) {
              setSpecs(
                Object.entries(p.specifications).map(([key, value]) => ({ key, value }))
              );
            }

            if (p.images && p.images.length > 0) {
              setImageUrls(p.images.map((img) => img.url));
              const primaryIdx = p.images.findIndex((img) => img.isPrimary);
              setPrimaryImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
            }
          }
        })
        .catch((err) => {
          setErrorMessage(err?.message || 'Failed to load product details.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEditing, id]);

  const handleAddSpec = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', text: string) => {
    setSpecs((prev) => {
      const copy = [...prev];
      copy[index][field] = text;
      return copy;
    });
  };

  const handleAddImageUrl = () => {
    setImageUrls((prev) => [...prev, '']);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= imageUrls.length - 1) {
      setPrimaryImageIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const priceCents = rupeesToCents(priceRupees);
    if (priceCents < 100) {
      setErrorMessage('Price must be at least Rs. 1.00 (100 cents).');
      return;
    }

    if (Number(stock) < 0) {
      setErrorMessage('Stock cannot be negative.');
      return;
    }

    if (!name.trim() || !sku.trim() || !categoryId || !brandId) {
      setErrorMessage('Name, SKU, Category, and Brand are mandatory fields.');
      return;
    }

    setIsSubmitting(true);

    // Build specs record
    const specRecord: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specRecord[s.key.trim()] = s.value.trim();
      }
    });

    // Build images array
    const validImages = imageUrls
      .filter((u) => u.trim().length > 0)
      .map((url, idx) => ({
        url: url.trim(),
        isPrimary: idx === primaryImageIndex,
      }));

    if (validImages.length === 0) {
      validImages.push({
        url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
        isPrimary: true,
      });
    }

    const payload: Partial<ProductItem> = {
      name: name.trim(),
      sku: sku.trim(),
      partNumber: partNumber.trim() || undefined,
      oemNumber: oemNumber.trim() || undefined,
      categoryId,
      brandId,
      condition,
      priceInCents: priceCents,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      warrantyMonths: Number(warrantyMonths),
      description: description.trim(),
      isUniversalFit,
      specifications: specRecord,
      images: validImages,
    };

    try {
      let savedProduct: ProductItem;
      if (isEditing && id) {
        const res = await sellerProductsApi.update(id, payload);
        savedProduct = res.data;
      } else {
        const res = await sellerProductsApi.create(payload);
        savedProduct = res.data;
      }

      // If compatibility row was filled, add compatibility mapping
      if (compMake && compModel) {
        try {
          await sellerProductsApi.addCompatibility(savedProduct._id, {
            make: compMake,
            model: compModel,
            yearFrom: Number(compYearFrom),
            yearTo: Number(compYearTo),
            engine: compEngine.trim() || undefined,
          });
        } catch {
          // Compatibility addition non-blocking
        }
      }

      setSuccessMessage('Product listing saved successfully!');
      setTimeout(() => {
        navigate('/seller/products');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save product listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-medium">Loading product form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
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
            <h1 className="text-2xl font-black text-slate-900">
              {isEditing ? 'Edit Spare Part Listing' : 'Create Spare Part Listing'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditing
                ? `Updating inventory record SKU: ${sku}`
                : 'Publish an OEM or aftermarket spare part to the AutoDock marketplace.'}
            </p>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identifiers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            1. Basic Part Information
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Front Ceramic Brake Pads for Toyota Corolla 2014-2019"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  SKU (Store Part Code) *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. BRK-PAD-TY14"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Part Number (Optional)
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="e.g. 04465-02220"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  OEM Reference (Optional)
                </label>
                <input
                  type="text"
                  value={oemNumber}
                  onChange={(e) => setOemNumber(e.target.value)}
                  placeholder="e.g. OEM-TY-0987"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Brand / Manufacturer *
                </label>
                <select
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Condition *
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="NEW">Brand New</option>
                  <option value="RECONDITIONED">Reconditioned</option>
                  <option value="USED">Used / Tested</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Technical Description *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive technical details, materials, installation tips, and included accessories..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            2. Pricing & Stock
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Price in LKR (Rs.) *
              </label>
              <input
                type="number"
                step="0.01"
                min={1}
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                placeholder="e.g. 14500.00"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Low Stock Warning Level
              </label>
              <input
                type="number"
                min={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Warranty (Months)
              </label>
              <input
                type="number"
                min={0}
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media Gallery */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              3. Product Images
            </h3>
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Image URL</span>
            </button>
          </div>

          <div className="space-y-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const copy = [...imageUrls];
                    copy[idx] = e.target.value;
                    setImageUrls(copy);
                  }}
                  placeholder="https://example.com/part-photo.jpg"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />

                <label className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0 cursor-pointer">
                  <input
                    type="radio"
                    name="primary-image"
                    checked={primaryImageIndex === idx}
                    onChange={() => setPrimaryImageIndex(idx)}
                    className="text-blue-600"
                  />
                  <span>Primary</span>
                </label>

                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImageUrl(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Specifications Key-Values */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              4. Technical Attributes
            </h3>
            <button
              type="button"
              onClick={handleAddSpec}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Specification</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {specs.map((s, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Attribute (e.g. Material)"
                  value={s.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="w-1/3 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Ceramic Composite)"
                  value={s.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {specs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Vehicle Compatibility */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              <span>5. Vehicle Fitment Compatibility</span>
            </h3>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isUniversalFit}
                onChange={(e) => setIsUniversalFit(e.target.checked)}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-bold">Universal Vehicle Fitment</span>
            </label>
          </div>

          {!isUniversalFit && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Add Compatible Vehicle Model
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <select
                  value={compMake}
                  onChange={(e) => {
                    setCompMake(e.target.value);
                    setCompModel('');
                  }}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">Make</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={compModel}
                  disabled={!compMake}
                  onChange={(e) => setCompModel(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white disabled:opacity-50"
                >
                  <option value="">Model</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Year From"
                  value={compYearFrom}
                  onChange={(e) => setCompYearFrom(parseInt(e.target.value, 10) || 2010)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                />

                <input
                  type="number"
                  placeholder="Year To"
                  value={compYearTo}
                  onChange={(e) => setCompYearTo(parseInt(e.target.value, 10) || 2025)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                />

                <input
                  type="text"
                  placeholder="Engine / Trim"
                  value={compEngine}
                  onChange={(e) => setCompEngine(e.target.value)}
                  className="text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/seller/products"
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Update Listing' : 'Publish to Catalogue'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
