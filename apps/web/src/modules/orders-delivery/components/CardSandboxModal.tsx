import React, { useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { cardPaymentApi } from '../api/ordersDeliveryApi.js';
import { apiClient } from '../../../shared/api/apiClient.js';
import { Alert, Button, Modal } from '../../../shared/components/index.js';

interface CardSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  suborderId: string;
  suborderNumber: string;
  onPaymentSimulated: () => void;
}

export const CardSandboxModal: React.FC<CardSandboxModalProps> = ({
  isOpen,
  onClose,
  suborderId,
  suborderNumber,
  onPaymentSimulated,
}) => {
  const [session, setSession] = useState<{ sessionId: string; checkoutUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInitiateSession = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await cardPaymentApi.initiateCardPayment(suborderId);
      if (response.success && response.data) {
        setSession({
          sessionId: response.data.sessionId,
          checkoutUrl: response.data.checkoutUrl,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to start card payment session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!session) return;
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      const response: any = await apiClient.post('/payments/sandbox-simulator/callback', {
        sessionId: session.sessionId,
        status: 'SUCCESS',
      });
      if (response.success) {
        setSuccessMessage('Card payment authorized. Your order is now paid.');
        setTimeout(() => {
          onPaymentSimulated();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to confirm card payment.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Card Payment Checkout"
      subtitle={`Order ${suborderNumber}`}
      size="sm"
    >
      <div className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {!session ? (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-[#E11D30] shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">
                Continue to authorize payment for this seller package via the test payment gateway.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isLoading}
                onClick={handleInitiateSession}
              >
                Start Card Checkout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1">
              <span className="text-slate-500 block">Payment Session Ready</span>
              <span className="font-mono font-semibold text-slate-900 break-all">
                {session.sessionId}
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              isLoading={isSimulating}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmPayment}
            >
              Complete Test Card Payment
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
