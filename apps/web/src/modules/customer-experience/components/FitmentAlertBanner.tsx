import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { FitmentStatus } from '../api/customerExperienceApi.js';

interface FitmentAlertBannerProps {
  status?: FitmentStatus;
  vehicleName?: string;
  notes?: string;
  isUniversalFit?: boolean;
}

export const FitmentAlertBanner: React.FC<FitmentAlertBannerProps> = ({
  status,
  vehicleName,
  notes,
  isUniversalFit = false,
}) => {
  if (isUniversalFit) {
    return (
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-blue-950">Universal Fitment Part</h4>
          <p className="text-sm text-blue-900 mt-0.5">
            This part is marked for universal vehicle use across standard configurations.
          </p>
        </div>
      </div>
    );
  }

  if (!status || !vehicleName) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Verify Vehicle Compatibility
          </h4>
          <p className="text-sm text-slate-600 mt-0.5">
            Add or select a vehicle in your garage to confirm whether this part fits your model.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'EXACT_FIT') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-950">
            Fits your {vehicleName}
          </h4>
          {notes && <p className="text-sm text-emerald-900 mt-0.5">{notes}</p>}
        </div>
      </div>
    );
  }

  if (status === 'DOES_NOT_FIT') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-rose-950">
            Does not fit your {vehicleName}
          </h4>
          <p className="text-sm text-rose-900 mt-0.5">
            {notes || 'Check the part number or choose a matching variant for your vehicle.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <h4 className="text-sm font-semibold text-amber-950">
          Fitment not confirmed for {vehicleName}
        </h4>
        <p className="text-sm text-amber-900 mt-0.5">
          {notes || 'Compare OEM specifications carefully before ordering.'}
        </p>
      </div>
    </div>
  );
};
