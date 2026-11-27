import React, { useState, useEffect } from 'react';
import { Building2, Copy, Check, Upload } from 'lucide-react';
import {
  PlatformBankSettings,
  publicFinanceApi,
} from '../api/financePromotionsApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { Alert, Button, Modal } from '../../../shared/components/index.js';

interface InvoiceBankInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  outstandingBalanceInCents: number;
  onOpenUpload?: () => void;
}

export const InvoiceBankInstructionsModal: React.FC<
  InvoiceBankInstructionsModalProps
> = ({
  isOpen,
  onClose,
  invoiceNumber,
  outstandingBalanceInCents,
  onOpenUpload,
}) => {
  const [bankSettings, setBankSettings] = useState<PlatformBankSettings | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedReference, setCopiedReference] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    publicFinanceApi
      .getPlatformBankAccount()
      .then((res) => {
        if (res.success && res.data) {
          setBankSettings(res.data);
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Unable to load platform bank account.');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  const copyText = (text: string, which: 'acct' | 'ref') => {
    navigator.clipboard?.writeText(text);
    if (which === 'acct') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedReference(true);
      setTimeout(() => setCopiedReference(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Commission Payment Instructions"
      subtitle={`Invoice ${invoiceNumber}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onOpenUpload && (
            <Button
              variant="primary"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
            >
              Upload Deposit Slip
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">Outstanding Balance</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">
            {formatLKR(outstandingBalanceInCents)}
          </span>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {isLoading ? (
          <div className="h-36 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-500">
            Loading bank account details...
          </div>
        ) : bankSettings ? (
          <>
            <dl className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
              <div className="p-3.5 flex items-center justify-between gap-2">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Bank</span>
                </dt>
                <dd className="font-semibold text-slate-900">
                  {bankSettings.bankName}
                </dd>
              </div>
              <div className="p-3.5 flex items-center justify-between gap-2">
                <dt className="text-slate-500">Branch</dt>
                <dd className="font-medium text-slate-900">
                  {bankSettings.branchName}
                  {bankSettings.branchCode ? ` (${bankSettings.branchCode})` : ''}
                </dd>
              </div>
              <div className="p-3.5 flex items-center justify-between gap-2">
                <dt className="text-slate-500">Account Holder</dt>
                <dd className="font-medium text-slate-900">
                  {bankSettings.accountHolderName}
                </dd>
              </div>
              <div className="p-3.5 flex items-center justify-between gap-2">
                <dt className="text-slate-500">Account Number</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900">
                    {bankSettings.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(bankSettings.accountNumber, 'acct')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-xs text-slate-700"
                  >
                    {copiedAccount ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                  </button>
                </dd>
              </div>
              <div className="p-3.5 flex items-center justify-between gap-2">
                <dt className="text-slate-500">Payment Reference</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#E11D30]">
                    {invoiceNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(invoiceNumber, 'ref')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-slate-50 text-xs text-slate-700"
                  >
                    {copiedReference ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedReference ? 'Copied' : 'Copy'}</span>
                  </button>
                </dd>
              </div>
            </dl>
            {bankSettings.paymentInstructions && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {bankSettings.paymentInstructions}
              </p>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
};
