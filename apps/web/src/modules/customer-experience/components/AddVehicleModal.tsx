import React, { useState, useEffect } from 'react';
import { X, Car, AlertCircle, Loader2 } from 'lucide-react';
import { garageApi, taxonomyApi } from '../api/customerExperienceApi.js';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentVehicleCount: number;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentVehicleCount,
}) => {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [submodel, setSubmodel] = useState<string>('');
  const [engine, setEngine] = useState<string>('');
  const [vin, setVin] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(currentVehicleCount === 0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      taxonomyApi.getMakes().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setMakes(res.data);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMake) {
      taxonomyApi.getModels(selectedMake).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setModels(res.data);
        }
      }).catch(() => {});
    } else {
      setModels([]);
    }
  }, [selectedMake]);

  if (!isOpen) return null;

  const isMaxCapacity = currentVehicleCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMaxCapacity) {
      setErrorMessage('You have reached the maximum limit of 10 saved vehicles in My Garage.');
      return;
    }
    if (!selectedMake || !selectedModel || !year) {
      setErrorMessage('Make, Model, and Year are mandatory.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await garageApi.addVehicle({
        make: selectedMake,
        model: selectedModel,
        year: Number(year),
        submodel: submodel.trim() || undefined,
        engine: engine.trim() || undefined,
        vin: vin.trim() || undefined,
        nickname: nickname.trim() || undefined,
        isDefault,
      });

      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save vehicle to your garage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add Vehicle to My Garage</h3>
              <p className="text-xs text-slate-500">
                Vehicle profile ({currentVehicleCount}/10 saved)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isMaxCapacity ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Garage Limit Reached</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              My Garage supports a maximum of 10 saved vehicles. Please remove an older vehicle to add a new one.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Make & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Make *
                </label>
                <select
                  value={selectedMake}
                  onChange={(e) => {
                    setSelectedMake(e.target.value);
                    setSelectedModel('');
                  }}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Make</option>
                  {makes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Model *
                </label>
                <select
                  value={selectedModel}
                  disabled={!selectedMake}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                >
                  <option value="">Select Model</option>
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year & Engine */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Manufacture Year *
                </label>
                <input
                  type="number"
                  min={1960}
                  max={2035}
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Engine / Submodel (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.8L Hybrid, Altis Grande"
                  value={submodel}
                  onChange={(e) => {
                    setSubmodel(e.target.value);
                    setEngine(e.target.value);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Nickname & Submodel */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle Nickname (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Daily Commuter"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Chassis / VIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NZE161-123456"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Default Vehicle Toggle */}
            <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold">Set as primary default vehicle for catalogue fitment</span>
            </label>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedMake || !selectedModel}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save to My Garage</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
