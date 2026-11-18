import React, { useState } from 'react';
import { X, Truck, AlertCircle, Loader2 } from 'lucide-react';
import { sellerOrderApi } from '../api/ordersDeliveryApi.js';

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
  const [courierName, setCourierName] = useState<string>('Domex Courier');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('');
  const [courierContactPhone, setCourierContactPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName.trim() || !trackingNumber.trim()) {
      setErrorMessage('Courier service name and tracking consignment number are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: 'DISPATCHED',
        courierDetails: {
          courierName: courierName.trim(),
          trackingNumber: trackingNumber.trim(),
          estimatedDeliveryDate: estimatedDeliveryDate || undefined,
          courierContactPhone: courierContactPhone.trim() || undefined,
        },
      });

      if (response.success) {
        onDispatchSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch suborder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Dispatch Package</h3>
              <p className="text-xs text-slate-500">Suborder Reference: {suborderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Courier Partner <span className="text-red-500">*</span>
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Domex Courier">Domex Courier</option>
              <option value="Certis Lanka Courier">Certis Lanka Courier</option>
              <option value="Pronto Lanka">Pronto Lanka</option>
              <option value="PromptX Express">PromptX Express</option>
              <option value="Koombiyo Delivery">Koombiyo Delivery</option>
              <option value="Fardar Express">Fardar Express</option>
              <option value="Other Courier Service">Other Courier Service</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Courier Tracking / Waybill Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. DMX-89234190"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estimated Delivery Date (Optional)
            </label>
            <input
              type="date"
              value={estimatedDeliveryDate}
              onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Courier Contact Phone (Optional)
            </label>
            <input
              type="tel"
              value={courierContactPhone}
              onChange={(e) => setCourierContactPhone(e.target.value)}
              placeholder="e.g. +94 11 755 5555"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <span>Confirm Dispatch</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
