import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
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
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-teal-950">Universal Fitment Spare Part</h4>
          <p className="text-xs text-teal-800 mt-0.5">
            This component is engineered as a universal vehicle part compatible across most automotive makes and standard configurations.
          </p>
        </div>
      </div>
    );
  }

  if (!status || !vehicleName) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-slate-800">Check Vehicle Fitment</h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Select your vehicle in the filter bar or from My Garage to verify compatibility before purchasing.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'EXACT_FIT') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-emerald-950">
            ✓ Guaranteed Fit for {vehicleName}
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            This spare part is verified compatible with your saved vehicle profile based on OEM specifications.
            {notes ? ` Note: ${notes}` : ''}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'DOES_NOT_FIT') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-rose-950">
            ✕ Does Not Fit {vehicleName}
          </h4>
          <p className="text-xs text-rose-800 mt-0.5">
            Our compatibility database indicates this part does not match the specifications of your selected vehicle.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <h4 className="text-sm font-bold text-amber-950">Fitment Uncertainty for {vehicleName}</h4>
        <p className="text-xs text-amber-800 mt-0.5">
          Compatibility details for this specific vehicle trim or engine are not fully confirmed. Please verify OEM part numbers.
        </p>
      </div>
    </div>
  );
};
