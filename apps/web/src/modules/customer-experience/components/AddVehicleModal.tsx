import React, { useState, useEffect } from 'react';
import { garageApi, taxonomyApi } from '../api/customerExperienceApi.js';
import { Alert, Button, Input, Modal, Select } from '../../../shared/components/index.js';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (!isOpen) return;
    taxonomyApi
      .getMakes()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setMakes(res.data);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      return;
    }
    taxonomyApi
      .getModels(selectedMake)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setModels(res.data);
      })
      .catch(() => setModels([]));
  }, [selectedMake]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedMake || !selectedModel) {
      setErrorMessage('Please select both vehicle make and model.');
      return;
    }

    setIsSubmitting(true);
    try {
      await garageApi.addVehicle({
        make: selectedMake,
        model: selectedModel,
        year,
        submodel: submodel.trim() || undefined,
        engine: engine.trim() || undefined,
        vin: vin.trim() || undefined,
        nickname: nickname.trim() || undefined,
        isDefault,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to add vehicle to your garage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vehicle to My Garage"
      subtitle="Save a vehicle to automatically check part fitment across the catalog"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Make"
            required
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value);
              setSelectedModel('');
            }}
            placeholder="Select Make"
            options={makes.map((m) => ({ value: m, label: m }))}
          />
          <Select
            label="Model"
            required
            disabled={!selectedMake}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            placeholder="Select Model"
            options={models.map((m) => ({ value: m, label: m }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Model Year"
            required
            value={String(year)}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            options={years.map((y) => ({ value: String(y), label: String(y) }))}
          />
          <Input
            label="Trim / Grade"
            value={submodel}
            onChange={(e) => setSubmodel(e.target.value)}
            placeholder="e.g. G-Grade, VTi-S"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Engine Spec"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            placeholder="e.g. 1.8L Hybrid"
          />
          <Input
            label="Chassis / VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="Optional chassis code"
          />
        </div>

        <Input
          label="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. Daily Commuter"
        />

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="rounded border-slate-300 text-[#E11D30] focus:ring-[#E11D30]"
          />
          <span>Set as my default garage vehicle</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Vehicle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
