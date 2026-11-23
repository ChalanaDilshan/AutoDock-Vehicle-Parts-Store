import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, ChevronDown, X, Plus, Wrench } from 'lucide-react';
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
    <div className="bg-slate-900 text-white rounded-lg p-4 sm:p-4.5 border border-slate-800 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-md text-slate-300">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Vehicle Fitment Engine
            </div>
            {hasSelectedVehicle ? (
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="font-bold text-sm sm:text-base text-white">
                  {selectedVehicle?.year ? `${selectedVehicle.year} ` : ''}
                  {selectedVehicle?.make} {selectedVehicle?.model}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Fitment Active</span>
                </span>
              </div>
            ) : (
              <div className="text-xs text-slate-300 mt-0.5">
                Select your vehicle to guarantee exact chassis compatibility and avoid ordering incorrect parts.
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
              className="px-2.5 py-1.5 rounded-md border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpenDropdown((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            <span>{hasSelectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpenDropdown ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpenDropdown && (
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick select from My Garage */}
          <div className="bg-slate-950 p-3.5 rounded-md border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                <span>Saved in My Garage</span>
              </span>
              <Link to="/garage" className="text-blue-400 hover:text-blue-300 text-xs font-medium flex items-center gap-0.5">
                <Plus className="w-3 h-3" />
                <span>Manage</span>
              </Link>
            </div>
            {garageVehicles.length === 0 ? (
              <p className="text-xs text-slate-400">
                No vehicles in My Garage. Add vehicles to filter matching parts quickly.
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {garageVehicles.map((v) => (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => {
                      onSelectVehicle({ make: v.make, model: v.model, year: v.year });
                      setIsOpenDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs flex items-center justify-between transition"
                  >
                    <span className="font-medium text-slate-200">
                      {v.year} {v.make} {v.model}
                      {v.nickname ? ` (${v.nickname})` : ''}
                    </span>
                    {v.isDefault && (
                      <span className="text-[10px] text-blue-400 font-semibold">
                        Primary
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filter Vehicle on the fly */}
          <div className="bg-slate-950 p-3.5 rounded-md border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Filter by Make & Model
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={customMake}
                onChange={(e) => {
                  setCustomMake(e.target.value);
                  setCustomModel('');
                }}
                className="bg-slate-900 border border-slate-700 text-white rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="bg-slate-900 border border-slate-700 text-white rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
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
                className="bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              disabled={!customMake || !customModel}
              onClick={handleApplyCustomVehicle}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-xs font-semibold transition"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
