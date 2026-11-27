import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import {
  adminFinanceApi,
  PlatformBankSettings,
} from '../../api/financePromotionsApi.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminPlatformBankSettingsPage: React.FC = () => {
  const [form, setForm] = useState<PlatformBankSettings>({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    branchCode: '',
    paymentInstructions: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    adminFinanceApi
      .getPlatformBankSettings()
      .then((res) => {
        if (res.success && res.data?.settings) {
          setForm(res.data.settings);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load platform bank settings.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      await adminFinanceApi.updatePlatformBankSettings(form);
      setSuccessMessage('Platform bank account instructions saved.');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Platform Bank Account Settings"
        subtitle="Update the corporate settlement account displayed to sellers on monthly commission invoices"
        backTo="/admin/finance"
        backLabel="Finance Overview"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {isLoading ? (
        <div className="h-72 bg-white border border-slate-200 rounded-lg" />
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              required
              value={form.bankName}
              onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
            />
            <Input
              label="Branch Name"
              required
              value={form.branchName}
              onChange={(e) => setForm((p) => ({ ...p, branchName: e.target.value }))}
            />
            <Input
              label="Account Holder Name"
              required
              value={form.accountHolderName}
              onChange={(e) =>
                setForm((p) => ({ ...p, accountHolderName: e.target.value }))
              }
            />
            <Input
              label="Account Number"
              required
              value={form.accountNumber}
              onChange={(e) =>
                setForm((p) => ({ ...p, accountNumber: e.target.value }))
              }
            />
          </div>

          <Input
            label="Branch Code / SWIFT"
            value={form.branchCode || ''}
            onChange={(e) => setForm((p) => ({ ...p, branchCode: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Transfer Reference Instructions
            </label>
            <textarea
              rows={3}
              value={form.paymentInstructions}
              onChange={(e) =>
                setForm((p) => ({ ...p, paymentInstructions: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Bank Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
