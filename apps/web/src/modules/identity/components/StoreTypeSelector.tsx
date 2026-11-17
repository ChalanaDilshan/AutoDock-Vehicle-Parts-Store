import React from 'react';
import { SellerStoreType } from '../api/identityApi.js';
import { Store, Globe, CheckCircle2 } from 'lucide-react';

interface StoreTypeSelectorProps {
  value: SellerStoreType;
  onChange: (type: SellerStoreType) => void;
  disabled?: boolean;
}

export const StoreTypeSelector: React.FC<StoreTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-3" role="radiogroup" aria-label="Select Store Operating Model">
      <label className="block text-sm font-semibold text-slate-800 mb-1">
        Store Operating Model <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Physical Store Card */}
        <div
          role="radio"
          aria-checked={value === 'PHYSICAL_STORE'}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onChange('PHYSICAL_STORE')}
          onKeyDown={(e) => {
            if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
              e.preventDefault();
              onChange('PHYSICAL_STORE');
            }
          }}
          className={`cursor-pointer rounded-lg border-2 p-4 transition relative flex flex-col justify-between ${
            value === 'PHYSICAL_STORE'
              ? 'border-blue-600 bg-blue-50/40 text-blue-950'
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {value === 'PHYSICAL_STORE' && (
            <div className="absolute top-3 right-3 text-blue-600">
              <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-md ${value === 'PHYSICAL_STORE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Physical Retail Store</h3>
              <p className="text-xs text-slate-500 mt-0.5">Walk-in spare parts shop or workshop</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-medium text-slate-700">Verification Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>BR Certificate + Owner NIC + Face Photo</li>
              <li className="font-medium text-blue-900">Physical Storefront & Workshop Photos</li>
              <li>On-site visit or WhatsApp video call verification</li>
            </ul>
          </div>
        </div>

        {/* Online-Only Store Card */}
        <div
          role="radio"
          aria-checked={value === 'ONLINE_ONLY'}
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && onChange('ONLINE_ONLY')}
          onKeyDown={(e) => {
            if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
              e.preventDefault();
              onChange('ONLINE_ONLY');
            }
          }}
          className={`cursor-pointer rounded-lg border-2 p-4 transition relative flex flex-col justify-between ${
            value === 'ONLINE_ONLY'
              ? 'border-blue-600 bg-blue-50/40 text-blue-950'
              : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {value === 'ONLINE_ONLY' && (
            <div className="absolute top-3 right-3 text-blue-600">
              <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
            </div>
          )}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-md ${value === 'ONLINE_ONLY' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Online-Only Merchant</h3>
              <p className="text-xs text-slate-500 mt-0.5">Warehouse or direct distributor without retail counter</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p className="font-medium text-slate-700">Verification Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li>BR Certificate + Owner NIC + Face Photo</li>
              <li className="text-emerald-700 font-medium">Storefront photos NOT required</li>
              <li>Document-based review</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
