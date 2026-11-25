import React, { useState, useEffect } from 'react';
import { BrandItem, taxonomyApi } from '../api/customerExperienceApi.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

interface BrandModalProps {
  brand: BrandItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  brand,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(brand?.name || '');
  const [slug, setSlug] = useState(brand?.slug || '');
  const [countryOfOrigin, setCountryOfOrigin] = useState(brand?.countryOfOrigin || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [isActive, setIsActive] = useState(brand ? brand.isActive : true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(brand?._id);

  useEffect(() => {
    setName(brand?.name || '');
    setSlug(brand?.slug || '');
    setCountryOfOrigin(brand?.countryOfOrigin || '');
    setDescription(brand?.description || '');
    setIsActive(brand ? brand.isActive : true);
    setErrorMessage(null);
  }, [brand, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !slug.trim()) {
      setErrorMessage('Brand name and slug are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<BrandItem> = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        countryOfOrigin: countryOfOrigin.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      };
      if (isEditing && brand) {
        await taxonomyApi.adminUpdateBrand(brand._id, payload);
      } else {
        await taxonomyApi.adminCreateBrand(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Manufacturer Brand' : 'Add Manufacturer Brand'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Input
          label="Brand Name"
          required
          value={name}
          onChange={(e) => {
            const val = e.target.value;
            setName(val);
            if (!isEditing) {
              setSlug(
                val
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, '')
              );
            }
          }}
          placeholder="e.g. Denso"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="URL Slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. denso"
          />
          <Input
            label="Country of Origin"
            value={countryOfOrigin}
            onChange={(e) => setCountryOfOrigin(e.target.value)}
            placeholder="e.g. Japan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional manufacturer notes"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          <span>Active manufacturer</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Brand' : 'Create Brand'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
