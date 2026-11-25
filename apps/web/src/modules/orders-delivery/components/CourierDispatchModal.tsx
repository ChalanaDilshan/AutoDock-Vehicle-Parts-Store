import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { sellerOrderApi } from '../api/ordersDeliveryApi.js';
import { Alert, Button, Input, Modal, Select } from '../../../shared/components/index.js';

interface CourierDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suborderId: string;
  suborderNumber: string;
  onDispatchSuccess: () => void;
}

export const CourierDispatchModal: React.FC<CourierDispatchModalProps> = ({
  isOpen,
  onClose,
  suborderId,
  suborderNumber,
  onDispatchSuccess,
}) => {
  const [courierName, setCourierName] = useState('Domex Courier');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [courierContactPhone, setCourierContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!courierName.trim() || !trackingNumber.trim()) {
      setErrorMessage('Courier service and tracking number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: 'DISPATCHED',
        courierDetails: {
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          estimatedDeliveryDate: estimatedDeliveryDate.trim() || undefined,
          courierContactPhone: courierContactPhone.trim() || undefined,
        },
      });
      onDispatchSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to dispatch order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dispatch Package"
      subtitle={`Suborder ${suborderNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Select
          label="Courier Provider"
          value={courierName}
          onChange={(e) => setCourierName(e.target.value)}
          options={[
            { value: 'Domex Courier', label: 'Domex Courier' },
            { value: 'Pronto Lanka', label: 'Pronto Lanka' },
            { value: 'Prompt Express', label: 'Prompt Express' },
            { value: 'PickMe Flash', label: 'PickMe Flash' },
            { value: 'Direct Fleet Delivery', label: 'Direct Store Fleet' },
          ]}
        />

        <Input
          label="Tracking / Consignment Number"
          required
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g. DMX-89234190"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Estimated Delivery Date"
            type="date"
            value={estimatedDeliveryDate}
            onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
          />
          <Input
            label="Courier Contact Phone"
            type="tel"
            value={courierContactPhone}
            onChange={(e) => setCourierContactPhone(e.target.value)}
            placeholder="Optional rider phone"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Truck className="w-4 h-4" />}
          >
            Confirm Dispatch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
