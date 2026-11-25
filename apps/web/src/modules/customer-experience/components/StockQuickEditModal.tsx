import React, { useState, useEffect } from 'react';
import { ProductItem, sellerProductsApi } from '../api/customerExperienceApi.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

interface StockQuickEditModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockQuickEditModal: React.FC<StockQuickEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newQuantity, setNewQuantity] = useState<number>(product?.stock ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setNewQuantity(product?.stock ?? 0);
    setErrorMessage(null);
  }, [product, isOpen]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (newQuantity < 0 || !Number.isFinite(newQuantity)) {
      setErrorMessage('Stock quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerProductsApi.adjustStock(product._id, {
        newQuantity: Math.floor(newQuantity),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Stock Update"
      subtitle={`${product.name} (${product.sku})`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Input
          label="New Stock Quantity"
          type="number"
          min={0}
          required
          value={newQuantity}
          onChange={(e) => setNewQuantity(Number(e.target.value))}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Update Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
