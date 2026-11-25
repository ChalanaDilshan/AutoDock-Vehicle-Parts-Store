import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { sellerApi, SellerStoreType } from '../../api/identityApi.js';
import { StoreTypeSelector } from '../../components/StoreTypeSelector.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerRegisterStep1Page: React.FC = () => {
  const navigate = useNavigate();

  const [sellerType, setSellerType] = useState<SellerStoreType>('PHYSICAL_STORE');
  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [province, setProvince] = useState('Western');
  const [postalCode, setPostalCode] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    setStoreSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (
      !businessName.trim() ||
      !storeSlug.trim() ||
      !businessRegistrationNumber.trim() ||
      !contactPhone.trim() ||
      !street.trim() ||
      !city.trim() ||
      !district.trim()
    ) {
      setErrorMessage('Please complete all required business details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sellerApi.registerProfile({
        businessName: businessName.trim(),
        storeSlug: storeSlug.trim(),
        sellerType,
        businessRegistrationNumber: businessRegistrationNumber.trim(),
        contactPhone: contactPhone.trim(),
        operatingAddress: {
          street: street.trim(),
          city: city.trim(),
          district: district.trim(),
          province: province.trim() || 'Western',
          postalCode: postalCode.trim() || '00100',
        },
      });
      if (response.success) {
        navigate('/seller/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to register store profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Register Your AutoDock Merchant Store"
        subtitle="Step 1 of 2: Enter your store profile and operating location before uploading verification documents"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Select Operating Model
          </h2>
          <StoreTypeSelector value={sellerType} onChange={setSellerType} />
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Business Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registered Business Name"
              required
              value={businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
              placeholder="e.g. Colombo Brake Specialists"
            />
            <Input
              label="Store URL Slug"
              required
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              placeholder="e.g. colombo-brake-specialists"
            />
            <Input
              label="Business Registration Number"
              required
              value={businessRegistrationNumber}
              onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
              placeholder="e.g. PV-12345"
            />
            <Input
              label="Business Contact Phone"
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+94 11 234 5678"
            />
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Operating Address
          </h2>
          <Input
            label="Street Address"
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. 12 Panchikawatte Road"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Colombo"
            />
            <Input
              label="District"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Colombo"
            />
            <Input
              label="Province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Western"
            />
            <Input
              label="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="01000"
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Continue to Document Verification
          </Button>
        </div>
      </form>
    </div>
  );
};
