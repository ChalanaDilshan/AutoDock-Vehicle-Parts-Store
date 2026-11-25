import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Star, Trash2, ArrowRight } from 'lucide-react';
import { GarageVehicle, garageApi } from '../api/customerExperienceApi.js';
import { AddVehicleModal } from '../components/AddVehicleModal.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const MyGaragePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<GarageVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadVehicles = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await garageApi.getVehicles();
      if (res.success && res.data?.vehicles) {
        setVehicles(res.data.vehicles);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your saved vehicles.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadVehicles();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleSetDefault = async (vehicleId: string) => {
    try {
      await garageApi.setDefault(vehicleId);
      await loadVehicles();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update default vehicle.');
    }
  };

  const handleRemove = async (vehicleId: string) => {
    try {
      await garageApi.removeVehicle(vehicleId);
      await loadVehicles();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to remove vehicle.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<Car className="w-6 h-6" />}
          title="Sign in to manage My Garage"
          description="Save your vehicle models once to quickly check compatibility on any spare part."
          action={
            <Link to="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="My Garage"
        subtitle="Save up to 10 vehicles for quick spare-part fitment checks"
        badge={
          <Badge variant="default" size="md">
            {vehicles.length}/10 Vehicles Saved
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            disabled={vehicles.length >= 10}
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Vehicle
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="h-44 bg-white border border-slate-200 rounded-lg" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={<Car className="w-6 h-6" />}
          title="No vehicles in your garage yet"
          description="Add your car make, model, and year to filter compatible spare parts with one click."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Your First Vehicle
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle._id}
              className={`bg-white rounded-lg border p-5 flex flex-col justify-between gap-4 ${
                vehicle.isDefault ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>
                    {vehicle.isDefault && (
                      <Badge variant="primary" size="sm">
                        Default
                      </Badge>
                    )}
                  </div>
                  {vehicle.nickname && (
                    <p className="text-sm text-slate-600">
                      {`"${vehicle.nickname}"`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    {vehicle.engine && <span>Engine: {vehicle.engine}</span>}
                    {vehicle.submodel && <span>Trim: {vehicle.submodel}</span>}
                    {vehicle.vin && <span className="font-mono">VIN: {vehicle.vin}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(vehicle._id)}
                  aria-label={`Remove ${vehicle.make} ${vehicle.model}`}
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <Link
                  to={`/products?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}&year=${vehicle.year}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  <span>Shop compatible parts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {!vehicle.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Star className="w-3.5 h-3.5" />}
                    onClick={() => handleSetDefault(vehicle._id)}
                  >
                    Set Default
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadVehicles}
        currentVehicleCount={vehicles.length}
      />
    </div>
  );
};
