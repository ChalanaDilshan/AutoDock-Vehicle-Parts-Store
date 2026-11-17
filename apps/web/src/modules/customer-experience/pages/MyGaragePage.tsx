import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Plus,
  Trash2,
  CheckCircle2,
  Star,
  Search,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { GarageVehicle, garageApi } from '../api/customerExperienceApi.js';
import { AddVehicleModal } from '../components/AddVehicleModal.js';

export const MyGaragePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchGarage = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await garageApi.getVehicles();
      if (response.success && response.data?.vehicles) {
        setVehicles(response.data.vehicles);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your virtual garage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGarage();
  }, []);

  const handleSetDefault = async (vehicleId: string) => {
    try {
      const response = await garageApi.setDefault(vehicleId);
      if (response.success) {
        setActionSuccess('Default vehicle updated.');
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGarage();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to set default vehicle.');
    }
  };

  const handleRemove = async (vehicleId: string) => {
    if (!window.confirm('Are you sure you want to remove this vehicle from your garage?')) {
      return;
    }
    try {
      const response = await garageApi.removeVehicle(vehicleId);
      if (response.success) {
        setActionSuccess('Vehicle removed from garage.');
        setTimeout(() => setActionSuccess(null), 3000);
        fetchGarage();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove vehicle.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Virtual Fleet</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {vehicles.length}/10 Vehicles Saved
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">My Garage</h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Save up to 10 vehicles in your garage profile for instant, 1-click compatible spare-part discovery and fitment verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={vehicles.length >= 10}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Vehicle Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-medium">Loading saved vehicles...</p>
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                v.isDefault ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        v.isDefault ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {v.year} {v.make} {v.model}
                      </h3>
                      {v.nickname && (
                        <span className="text-xs text-slate-500 font-medium italic">"{v.nickname}"</span>
                      )}
                    </div>
                  </div>

                  {v.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(v._id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 my-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Engine / Trim</span>
                    <span className="text-slate-700 font-semibold">{v.engine || v.submodel || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Chassis / VIN</span>
                    <span className="text-slate-700 font-semibold font-mono">{v.vin || 'Not Registered'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3">
                <Link
                  to={`/products?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(
                    v.model
                  )}&year=${v.year}`}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Matching Parts</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleRemove(v._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Remove vehicle from garage"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">Your Virtual Garage is Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Add your vehicle make, model, and year to eliminate wrong spare-part purchases and filter compatible items with 1 click.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Vehicle</span>
          </button>
        </div>
      )}

      {/* Trust Notice */}
      <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong>Strict Privacy & Ownership:</strong> Your garage vehicles and VIN records are stored securely with your customer account and never shared with other shoppers.
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGarage}
        currentVehicleCount={vehicles.length}
      />
    </div>
  );
};
