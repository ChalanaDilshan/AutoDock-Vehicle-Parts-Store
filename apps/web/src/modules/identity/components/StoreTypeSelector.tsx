import React from 'react';
import { Store, Globe, Check } from 'lucide-react';
import { SellerStoreType } from '../api/identityApi.js';

interface StoreTypeSelectorProps {
  value: SellerStoreType;
  onChange: (value: SellerStoreType) => void;
  disabled?: boolean;
}

export const StoreTypeSelector: React.FC<StoreTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options: Array<{
    type: SellerStoreType;
    title: string;
    subtitle: string;
    note: string;
    icon: React.ReactNode;
  }> = [
    {
      type: 'PHYSICAL_STORE',
      title: 'Physical Retail Store',
      subtitle: 'Auto parts shops, garages, and physical showrooms',
      note: 'Physical Storefront & Workshop Photos required',
      icon: <Store className="w-5 h-5" />,
    },
    {
      type: 'ONLINE_ONLY',
      title: 'Online-Only Merchant',
      subtitle: 'Direct importers, parts distributors, and warehouses',
      note: 'Storefront photos NOT required (verified via ID & video)',
      icon: <Globe className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {options.map((opt) => {
        const selected = value === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.type)}
            className={`text-left rounded-lg border p-4 transition-colors flex flex-col gap-2 ${
              selected
                ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-9 h-9 rounded-md flex items-center justify-center ${
                    selected
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {opt.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {opt.title}
                  </h3>
                  <p className="text-xs text-slate-500">{opt.subtitle}</p>
                </div>
              </div>
              {selected && (
                <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-700 pt-1">
              {opt.note}
            </p>
          </button>
        );
      })}
    </div>
  );
};
