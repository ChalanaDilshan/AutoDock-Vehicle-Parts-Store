import React, { useState, useEffect } from 'react';
import { CategoryItem, taxonomyApi } from '../api/customerExperienceApi.js';
import { Alert, Button, Input, Modal, Select } from '../../../shared/components/index.js';

interface CategoryModalProps {
  category: CategoryItem | null;
  parentCategories: CategoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  category,
  parentCategories,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [isActive, setIsActive] = useState(category ? category.isActive : true);
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(category?._id);

  useEffect(() => {
    setName(category?.name || '');
    setSlug(category?.slug || '');
    setDescription(category?.description || '');
    setParentId(category?.parentId || '');
    setIsActive(category ? category.isActive : true);
    setDisplayOrder(category?.displayOrder || 0);
    setErrorMessage(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim() || !slug.trim()) {
      setErrorMessage('Category name and URL slug are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<CategoryItem> = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
        parentId: parentId || null,
        isActive,
        displayOrder: Number(displayOrder) || 0,
      };
      if (isEditing && category) {
        await taxonomyApi.adminUpdateCategory(category._id, payload);
      } else {
        await taxonomyApi.adminCreateCategory(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add Category'}
      subtitle="Organize spare parts in the marketplace directory"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Input
          label="Category Name"
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
          placeholder="e.g. Brake Systems"
        />

        <Input
          label="URL Slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g. brake-systems"
        />

        <Select
          label="Parent Category"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          placeholder="Top-Level Category"
          options={parentCategories
            .filter((c) => c._id !== category?._id)
            .map((c) => ({ value: c._id, label: c.name }))}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of parts in this category"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <Input
            label="Display Order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value))}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 mt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-[#E11D30] focus:ring-[#E11D30]"
            />
            <span>Active in storefront</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
