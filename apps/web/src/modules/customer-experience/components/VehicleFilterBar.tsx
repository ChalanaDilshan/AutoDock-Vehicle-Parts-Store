import React, { useState, useEffect } from 'react';
import { Car, CheckCircle2, ChevronDown, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GarageVehicle, taxonomyApi } from '../api/customerExperienceApi.js';
import { Button, Select } from '../../../shared/components/index.js';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [make, setMake] = useState<string>(selectedVehicle?.make || '');
  const [model, setModel] = useState<string>(selectedVehicle?.model || '');
  const [year, setYear] = useState<string>(selectedVehicle?.year?.toString() || '');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => String(currentYear - i));

  useEffect(() => {
    setMake(selectedVehicle?.make || '');
    setModel(selectedVehicle?.model || '');
    setYear(selectedVehicle?.year?.toString() || '');
  }, [selectedVehicle?.make, selectedVehicle?.model, selectedVehicle?.year]);

  useEffect(() => {
    if (!isExpanded || makes.length > 0) return;
    taxonomyApi
      .getMakes()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setMakes(res.data);
      })
      .catch(() => {});
  }, [isExpanded, makes.length]);

  useEffect(() => {
    if (!make || !isExpanded) {
      setModels([]);
      return;
    }
    taxonomyApi
      .getModels(make)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setModels(res.data);
      })
      .catch(() => {});
  }, [make, isExpanded]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model) return;
    onSelectVehicle({
      make,
      model,
      year: year ? parseInt(year, 10) : undefined,
    });
    setIsExpanded(false);
  };

  const hasActiveVehicle = Boolean(selectedVehicle?.make && selectedVehicle?.model);

  return (
    <section
      aria-label="Vehicle fitment selector"
      className="bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-red-50 border border-red-200 text-[#E11D30] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4" aria-hidden="true" />
            </div>
            {hasActiveVehicle ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  Fitting: {selectedVehicle?.year || ''} {selectedVehicle?.make}{' '}
                  {selectedVehicle?.model}
                </span>
                <button
                  type="button"
                  onClick={onClearVehicle}
                  aria-label="Clear selected vehicle"
                  className="ml-1 text-emerald-700 hover:text-rose-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ) : (
              <div className="text-sm">
                <span className="font-semibold text-slate-900">Vehicle Fitment Filter</span>
                <span className="hidden sm:inline text-slate-500 ml-2 text-xs">
                  Match spare parts to your car make, model, and year
                </span>
              </div>
            )}

            {garageVehicles.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {garageVehicles.map((v) => {
                  const selected =
                    selectedVehicle?.make === v.make &&
                    selectedVehicle?.model === v.model &&
                    selectedVehicle?.year === v.year;
                  return (
                    <button
                      key={v._id}
                      type="button"
                      onClick={() =>
                        onSelectVehicle({ make: v.make, model: v.model, year: v.year })
                      }
                      className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-red-50 border-red-200 text-[#E11D30]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {v.year} {v.make} {v.model}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/garage"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#E11D30] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>My Garage</span>
            </Link>
            <Button
              variant="outline"
              size="sm"
              aria-expanded={isExpanded}
              rightIcon={
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              }
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {hasActiveVehicle ? 'Change Vehicle' : 'Select Vehicle'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <form
            onSubmit={handleApply}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100"
          >
            <Select
              aria-label="Vehicle Make"
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel('');
              }}
              placeholder="Make"
              options={makes.map((m) => ({ value: m, label: m }))}
            />
            <Select
              aria-label="Vehicle Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make}
              placeholder="Model"
              options={models.map((m) => ({ value: m, label: m }))}
            />
            <Select
              aria-label="Vehicle Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Any Year"
              options={years.map((y) => ({ value: y, label: y }))}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!make || !model}
              fullWidth
            >
              Apply Vehicle Fitment
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};
