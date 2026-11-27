import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';
import {
  sellerProductsApi,
  taxonomyApi,
  CategoryItem,
  BrandItem,
  ProductCondition,
} from '../../api/customerExperienceApi.js';
import { centsToRupees, rupeesToCents } from '../../utils/formatters.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Select,
} from '../../../../shared/components/index.js';

export const SellerProductEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [oemNumber, setOemNumber] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [condition, setCondition] = useState<string>('BRAND_NEW');
  const [priceRupees, setPriceRupees] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('3');
  const [warrantyMonths, setWarrantyMonths] = useState<string>('6');
  const [description, setDescription] = useState('');
  const [isUniversalFit, setIsUniversalFit] = useState(false);

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  const [compMake, setCompMake] = useState('');
  const [compModel, setCompModel] = useState('');
  const [compYearFrom, setCompYearFrom] = useState(2015);
  const [compYearTo, setCompYearTo] = useState(new Date().getFullYear());
  const [compEngine, setCompEngine] = useState('');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([
      taxonomyApi.getCategories(),
      taxonomyApi.getBrands(),
      taxonomyApi.getMakes(),
    ]).then(([catRes, brandRes, makeRes]) => {
      if (catRes.status === 'fulfilled' && catRes.value.success) setCategories(catRes.value.data);
      if (brandRes.status === 'fulfilled' && brandRes.value.success) setBrands(brandRes.value.data);
      if (makeRes.status === 'fulfilled' && makeRes.value.success) setMakes(makeRes.value.data);
    });
  }, []);

  useEffect(() => {
    if (!compMake) {
      setModels([]);
      return;
    }
    taxonomyApi
      .getModels(compMake)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setModels(res.data);
      })
      .catch(() => {});
  }, [compMake]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    sellerProductsApi
      .getById(id)
      .then((res) => {
        if (res.success && res.data) {
          const p = res.data;
          setName(p.name);
          setSku(p.sku);
          setPartNumber(p.partNumber || '');
          setOemNumber(p.oemNumber || '');
          setCategoryId(
            typeof p.categoryId === 'object' && p.categoryId
              ? p.categoryId._id
              : (p.categoryId as string) || ''
          );
          setBrandId(
            typeof p.brandId === 'object' && p.brandId
              ? p.brandId._id
              : (p.brandId as string) || ''
          );
          setCondition(
            p.condition === 'NEW' ? 'BRAND_NEW' : p.condition || 'BRAND_NEW'
          );
          setPriceRupees(String(centsToRupees(p.priceInCents)));
          setStock(String(p.stock));
          setLowStockThreshold(String(p.lowStockThreshold ?? 3));
          setWarrantyMonths(String(p.warrantyMonths ?? 6));
          setDescription(p.description || '');
          setIsUniversalFit(Boolean(p.isUniversalFit));

          const specEntries = Object.entries(p.specifications || {}).map(
            ([key, value]) => ({ key, value })
          );
          setSpecs(specEntries.length ? specEntries : [{ key: '', value: '' }]);

          if (p.images?.length) {
            setImageUrls(p.images.map((img) => img.url));
            const idx = p.images.findIndex((img) => img.isPrimary);
            setPrimaryImageIndex(idx >= 0 ? idx : 0);
          }
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load product.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedPrice = Number(priceRupees);
    if (!name.trim() || !sku.trim() || !categoryId || !brandId) {
      setErrorMessage('Name, SKU, category, and manufacturer brand are required.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage('Enter a valid selling price in LKR.');
      return;
    }

    const specMap: Record<string, string> = {};
    specs.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        specMap[row.key.trim()] = row.value.trim();
      }
    });

    const formattedImages = imageUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url, idx) => ({
        url,
        isPrimary: idx === primaryImageIndex,
      }));

    const payload: any = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      partNumber: partNumber.trim() || undefined,
      oemNumber: oemNumber.trim() || undefined,
      categoryId,
      brandId,
      condition: (condition === 'NEW' ? 'BRAND_NEW' : condition) as ProductCondition,
      priceInCents: rupeesToCents(parsedPrice),
      stock: Math.max(0, parseInt(stock, 10) || 0),
      lowStockThreshold: Math.max(0, parseInt(lowStockThreshold, 10) || 0),
      warrantyMonths: parseInt(warrantyMonths, 10) || undefined,
      description: description.trim(),
      isUniversalFit,
      specifications: specMap,
      images: formattedImages,
    };

    setIsSubmitting(true);
    try {
      const res = isEditing && id
        ? await sellerProductsApi.update(id, payload)
        : await sellerProductsApi.create(payload);

      const savedProduct = res.data;
      if (!isUniversalFit && savedProduct?._id && compMake && compModel) {
        await sellerProductsApi.addCompatibility(savedProduct._id, {
          make: compMake,
          model: compModel,
          yearFrom: compYearFrom,
          yearTo: compYearTo,
          engine: compEngine.trim() || undefined,
        });
      }

      navigate('/seller/products');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save product listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-96 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Spare Part' : 'Add New Spare Part'}
        subtitle="Provide accurate part numbers, pricing in LKR, and vehicle fitment details"
        backTo="/seller/products"
        backLabel="Back to Inventory"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Identity */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Basic Part Details
          </h2>

          <Input
            label="Product Title"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Front Ceramic Brake Pads Set"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Store SKU"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. BRK-TOY-01"
            />
            <Input
              label="Part Number"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Manufacturer part #"
            />
            <Input
              label="OEM Number"
              value={oemNumber}
              onChange={(e) => setOemNumber(e.target.value)}
              placeholder="Original OEM ref"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="Select category"
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
            <Select
              label="Brand"
              required
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              placeholder="Select brand"
              options={brands.map((b) => ({ value: b._id, label: b.name }))}
            />
            <Select
              label="Condition"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              options={[
                { value: 'BRAND_NEW', label: 'Brand New' },
                { value: 'RECONDITIONED', label: 'Reconditioned' },
                { value: 'USED', label: 'Used / Tested' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe part materials, packaging, and installation notes (min 20 characters)"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
            />
          </div>
        </section>

        {/* Pricing & Inventory */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Pricing &amp; Inventory
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Price (LKR)"
              type="number"
              required
              min={1}
              step="0.01"
              value={priceRupees}
              onChange={(e) => setPriceRupees(e.target.value)}
              placeholder="12500.00"
            />
            <Input
              label="Stock Units"
              type="number"
              required
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
            <Input
              label="Low-Stock Alert"
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
            <Input
              label="Warranty (Months)"
              type="number"
              min={0}
              value={warrantyMonths}
              onChange={(e) => setWarrantyMonths(e.target.value)}
            />
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Specifications
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setSpecs([...specs, { key: '', value: '' }])}
            >
              Add Row
            </Button>
          </div>
          <div className="space-y-2.5">
            {specs.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-5">
                  <Input
                    placeholder="Property (e.g. Material)"
                    value={row.key}
                    onChange={(e) => {
                      const next = [...specs];
                      next[idx].key = e.target.value;
                      setSpecs(next);
                    }}
                  />
                </div>
                <div className="sm:col-span-6">
                  <Input
                    placeholder="Value (e.g. Ceramic Composite)"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...specs];
                      next[idx].value = e.target.value;
                      setSpecs(next);
                    }}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="p-2 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    aria-label="Remove specification row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Product Images
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setImageUrls([...imageUrls, ''])}
            >
              Add Image URL
            </Button>
          </div>
          <div className="space-y-2.5">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="primaryImage"
                  checked={primaryImageIndex === idx}
                  onChange={() => setPrimaryImageIndex(idx)}
                  aria-label={`Set image ${idx + 1} as primary`}
                  className="text-[#E11D30]"
                />
                <div className="flex-1">
                  <Input
                    placeholder="https://example.com/part-image.jpg"
                    value={url}
                    onChange={(e) => {
                      const next = [...imageUrls];
                      next[idx] = e.target.value;
                      setImageUrls(next);
                    }}
                  />
                </div>
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrls(imageUrls.filter((_, i) => i !== idx));
                      setPrimaryImageIndex(0);
                    }}
                    className="p-2 rounded-md text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Fitment */}
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Vehicle Compatibility
          </h2>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isUniversalFit}
              onChange={(e) => setIsUniversalFit(e.target.checked)}
              className="rounded border-slate-300 text-[#E11D30] focus:ring-[#E11D30]"
            />
            <span>Universal fit (fits most passenger vehicles)</span>
          </label>

          {!isUniversalFit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              <Select
                label="Make"
                value={compMake}
                onChange={(e) => {
                  setCompMake(e.target.value);
                  setCompModel('');
                }}
                placeholder="Select Make"
                options={makes.map((m) => ({ value: m, label: m }))}
              />
              <Select
                label="Model"
                disabled={!compMake}
                value={compModel}
                onChange={(e) => setCompModel(e.target.value)}
                placeholder="Select Model"
                options={models.map((m) => ({ value: m, label: m }))}
              />
              <Input
                label="Year From"
                type="number"
                value={compYearFrom}
                onChange={(e) => setCompYearFrom(Number(e.target.value))}
              />
              <Input
                label="Year To"
                type="number"
                value={compYearTo}
                onChange={(e) => setCompYearTo(Number(e.target.value))}
              />
              <Input
                label="Engine (Opt)"
                value={compEngine}
                onChange={(e) => setCompEngine(e.target.value)}
                placeholder="e.g. 1.5L"
              />
            </div>
          )}
        </section>

        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/seller/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Save Changes' : 'Publish Spare Part'}
          </Button>
        </div>
      </form>
    </div>
  );
};
