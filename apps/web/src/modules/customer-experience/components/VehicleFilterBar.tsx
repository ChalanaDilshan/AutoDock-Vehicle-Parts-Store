import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, ChevronDown, X, Plus } from 'lucide-react';
import { GarageVehicle, taxonomyApi } from '../api/customerExperienceApi.js';
import { Link } from 'react-router-dom';

interface VehicleFilterBarProps {
  selectedVehicle?: {
    make?: string;
    model?: string;
    year?: number;
  };
  garageVehicles: GarageVehicle[];
  onSelectVehicle: (vehicle?: { make: string; model: string; year?: number }) => void;
  onClearVehicle: () => void;
}

export const VehicleFilterBar: React.FC<VehicleFilterBarProps> = ({
  selectedVehicle,
  garageVehicles,
  onSelectVehicle,
  onClearVehicle,
}) => {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [customMake, setCustomMake] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [customYear, setCustomYear] = useState<string>('');

  useEffect(() => {
    taxonomyApi.getMakes().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        setMakes(res.data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (customMake) {
      taxonomyApi.getModels(customMake).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setModels(res.data);
        }
      }).catch(() => {});
    } else {
      setModels([]);
    }
  }, [customMake]);

  const hasSelectedVehicle = Boolean(selectedVehicle?.make && selectedVehicle?.model);

  const handleApplyCustomVehicle = () => {
    if (customMake && customModel) {
      onSelectVehicle({
        make: customMake,
        model: customModel,
        year: customYear ? parseInt(customYear, 10) : undefined,
      });
      setIsOpenDropdown(false);
    }
  };

  return (
    <div className="relative bg-slate-900 text-white rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg text-white">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Vehicle Fitment Engine
            </div>
            {hasSelectedVehicle ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-base text-white">
                  {selectedVehicle?.year ? `${selectedVehicle.year} ` : ''}
                  {selectedVehicle?.make} {selectedVehicle?.model}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" />
                  Filtering Compatible Parts
                </span>
              </div>
            ) : (
              <div className="text-sm font-medium text-slate-300 mt-0.5">
                Select your vehicle to guarantee exact fitment and avoid ordering incorrect parts.
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasSelectedVehicle && (
            <button
              type="button"
              onClick={onClearVehicle}
              className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Vehicle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpenDropdown((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>{hasSelectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${isOpenDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpenDropdown && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick select from My Garage */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Saved in My Garage</span>
              <Link to="/garage" className="text-blue-400 hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" />
                <span>Manage Garage</span>
              </Link>
            </div>
            {garageVehicles.length === 0 ? (
              <p className="text-xs text-slate-500">
                No vehicles in My Garage. Add vehicles to switch between your garage fleet quickly.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {garageVehicles.map((v) => (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => {
                      onSelectVehicle({ make: v.make, model: v.model, year: v.year });
                      setIsOpenDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center justify-between transition"
                  >
                    <span className="font-medium text-slate-200">
                      {v.year} {v.make} {v.model}
                      {v.nickname ? ` (${v.nickname})` : ''}
                    </span>
                    {v.isDefault && (
                      <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filter Vehicle on the fly */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filter by Vehicle Make & Model
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={customMake}
                onChange={(e) => {
                  setCustomMake(e.target.value);
                  setCustomModel('');
                }}
                className="bg-slate-800 border border-slate-700 text-white rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Make</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={customModel}
                disabled={!customMake}
                onChange={(e) => setCustomModel(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Model</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Year"
                min={1960}
                max={2035}
                value={customYear}
                onChange={(e) => setCustomYear(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              disabled={!customMake || !customModel}
              onClick={handleApplyCustomVehicle}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition disabled:opacity-50"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
