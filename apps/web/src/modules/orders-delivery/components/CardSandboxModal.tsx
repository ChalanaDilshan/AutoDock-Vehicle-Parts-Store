import React, { useState } from 'react';
import { X, CreditCard, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import { cardPaymentApi } from '../api/ordersDeliveryApi.js';
import { apiClient } from '../../../shared/api/apiClient.js';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

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
      setErrorMessage(err?.message || 'Failed to initiate sandbox card session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!session) return;
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      // Trigger developer sandbox simulator callback endpoint
      const response: any = await apiClient.post('/payments/sandbox-simulator/callback', {
        sessionId: session.sessionId,
        status: 'SUCCESS',
      });

      if (response.success) {
        setSuccessMessage('Sandbox payment simulation confirmed! Suborder updated to PAID.');
        setTimeout(() => {
          onPaymentSimulated();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sandbox simulator callback failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Card Payment Gateway (Sandbox Mode)</h3>
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

        {/* Boundary Notice */}
        <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-purple-800">
            <ShieldAlert className="w-4 h-4" />
            <span>Developer Sandbox Demonstration</span>
          </div>
          <p className="leading-relaxed">
            AutoDock operates card payments in sandbox demonstration mode. Live card gateways (e.g. Commercial Bank IPG / PayHere) require final merchant split-settlement authorization. No PAN, CVV, or card data is ever collected on this application.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {session ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Sandbox Session ID</span>
                <span className="font-bold text-slate-900">{session.sessionId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Simulated Gateway Endpoint</span>
                <span className="text-blue-600 truncate block">{session.checkoutUrl}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Simulating HMAC Webhook Callback...</span>
                </>
              ) : (
                <span>Simulate Successful Card Authorization</span>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-600">
              Initialize a sandbox session token for suborder <strong>{suborderNumber}</strong> to simulate the hosted gateway redirect flow.
            </p>
            <button
              type="button"
              onClick={handleInitiateSession}
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm inline-flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Session...</span>
                </>
              ) : (
                <span>Generate Sandbox Session</span>
              )}
            </button>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
