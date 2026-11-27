import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { sellerApi, SellerStoreType } from '../../api/identityApi.js';
import { useAuth } from '../../context/AuthContext.js';
import { StoreTypeSelector } from '../../components/StoreTypeSelector.js';
import {
  getProvinceForDistrict,
  SRI_LANKA_DISTRICTS,
  SRI_LANKA_PROVINCES,
} from '../../constants/sriLankaLocations.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Select,
} from '../../../../shared/components/index.js';

type Step1FieldErrors = Partial<
  Record<
    | 'businessName'
    | 'storeSlug'
    | 'businessRegistrationNumber'
    | 'contactPhone'
    | 'street'
    | 'city'
    | 'district'
    | 'province'
    | 'postalCode',
    string
  >
>;

export function normalizeSriLankanPhone(rawPhone: string): string {
  return rawPhone.replace(/[\s-]+/g, '').trim();
}

export const SellerRegisterStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading, refreshProfile } = useAuth();

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

  const [fieldErrors, setFieldErrors] = useState<Step1FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExistingSeller = Boolean(
    isAuthenticated && user?.role === 'SELLER' && user?.sellerId
  );

  useEffect(() => {
    if (!isExistingSeller) return;

    let active = true;
    Promise.resolve(sellerApi.getMe())
      .then((res) => {
        if (!active) return;
        const status = res?.data?.verificationStatus;
        if (
          status === 'PENDING' ||
          status === 'UNDER_VERIFICATION' ||
          status === 'APPROVED'
        ) {
          navigate('/seller/dashboard', { replace: true });
        } else {
          navigate('/seller/onboarding', { replace: true });
        }
      })
      .catch(() => {
        if (!active) return;
        navigate('/seller/onboarding', { replace: true });
      });

    return () => {
      active = false;
    };
  }, [isExistingSeller, navigate]);

  const clearFieldError = (field: keyof Step1FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    clearFieldError('businessName');
    setStoreSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    );
    clearFieldError('storeSlug');
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    clearFieldError('district');
    const mappedProvince = getProvinceForDistrict(nextDistrict);
    if (mappedProvince) {
      setProvince(mappedProvince);
      clearFieldError('province');
    }
  };

  const validateFields = (): {
    valid: boolean;
    normalizedPhone: string;
    resolvedPostalCode: string;
  } => {
    const errors: Step1FieldErrors = {};
    const trimmedBusinessName = businessName.trim();
    const trimmedSlug = storeSlug.trim().toLowerCase();
    const trimmedBr = businessRegistrationNumber.trim();
    const normalizedPhone = normalizeSriLankanPhone(contactPhone);
    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    const trimmedDistrict = district.trim();
    const trimmedProvince = province.trim();
    const resolvedPostalCode = postalCode.trim() || '00100';

    if (trimmedBusinessName.length < 3 || trimmedBusinessName.length > 100) {
      errors.businessName = 'Business name must be between 3 and 100 characters.';
    }

    if (trimmedSlug.length < 3 || trimmedSlug.length > 50) {
      errors.storeSlug = 'Store slug must be between 3 and 50 characters.';
    } else if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      errors.storeSlug =
        'Store slug may only contain lowercase letters, numbers, and hyphens.';
    }

    if (trimmedBr.length < 3 || trimmedBr.length > 50) {
      errors.businessRegistrationNumber =
        'Business registration number must be at least 3 characters.';
    }

    if (!/^\+94\d{9}$/.test(normalizedPhone)) {
      errors.contactPhone =
        'Contact phone must follow Sri Lankan E.164 format: +94XXXXXXXXX.';
    }

    if (trimmedStreet.length < 3 || trimmedStreet.length > 150) {
      errors.street = 'Street address must be at least 3 characters.';
    }

    if (trimmedCity.length < 2 || trimmedCity.length > 100) {
      errors.city = 'City must be at least 2 characters.';
    }

    if (!trimmedDistrict) {
      errors.district = 'Please select your operating district.';
    }

    if (trimmedProvince.length < 2) {
      errors.province = 'Please select your operating province.';
    }

    if (!/^\d{5}$/.test(resolvedPostalCode)) {
      errors.postalCode = 'Postal code must be a 5-digit number.';
    }

    setFieldErrors(errors);
    return {
      valid: Object.keys(errors).length === 0,
      normalizedPhone,
      resolvedPostalCode,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { valid, normalizedPhone, resolvedPostalCode } = validateFields();
    setContactPhone(normalizedPhone);

    if (!valid) {
      setErrorMessage('Please fix the highlighted fields before continuing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sellerApi.registerProfile({
        businessName: businessName.trim(),
        storeSlug: storeSlug.trim().toLowerCase(),
        sellerType,
        businessRegistrationNumber: businessRegistrationNumber.trim(),
        contactPhone: normalizedPhone,
        operatingAddress: {
          street: street.trim(),
          city: city.trim(),
          district: district.trim(),
          province: province.trim() || 'Western',
          postalCode: resolvedPostalCode,
        },
      });
      if (response.success) {
        await refreshProfile().catch(() => undefined);
        navigate('/seller/onboarding');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to register store profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          role="status"
          aria-live="polite"
          className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-600"
        >
          Verifying account session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <PageHeader
          title="Register Your AutoDock Merchant Store"
          subtitle="Step 1 of 2: Store profile and operating location"
          backTo="/seller/register"
          backLabel="Back to Sell on AutoDock"
        />

        <section
          aria-label="Account required to register store"
          className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-5 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E11D30] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                You need an AutoDock account to register as a seller.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sign in to your existing account or create a new AutoDock account first. You will return directly to this store registration step afterward.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link to="/login?next=/sellers/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="min-h-[44px]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </Link>
            <Link to="/register?next=/sellers/register" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                className="min-h-[44px]"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (isExistingSeller) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          role="status"
          aria-live="polite"
          className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-600"
        >
          Redirecting to your merchant workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Register Your AutoDock Merchant Store"
        subtitle="Step 1 of 2: Enter your store profile and operating location before uploading verification documents"
        backTo="/seller/register"
        backLabel="Back to Sell on AutoDock"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
              error={fieldErrors.businessName}
            />
            <Input
              label="Store URL Slug"
              required
              value={storeSlug}
              onChange={(e) => {
                setStoreSlug(e.target.value);
                clearFieldError('storeSlug');
              }}
              placeholder="e.g. colombo-brake-specialists"
              helperText="Lowercase letters, numbers, and hyphens only"
              error={fieldErrors.storeSlug}
            />
            <Input
              label="Business Registration Number"
              required
              value={businessRegistrationNumber}
              onChange={(e) => {
                setBusinessRegistrationNumber(e.target.value);
                clearFieldError('businessRegistrationNumber');
              }}
              placeholder="e.g. PV-12345"
              error={fieldErrors.businessRegistrationNumber}
            />
            <Input
              label="Business Contact Phone"
              type="tel"
              required
              value={contactPhone}
              onChange={(e) => {
                setContactPhone(e.target.value);
                clearFieldError('contactPhone');
              }}
              placeholder="+94 77 123 4567"
              helperText="Format: +94XXXXXXXXX, e.g. +94771234567"
              error={fieldErrors.contactPhone}
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
            onChange={(e) => {
              setStreet(e.target.value);
              clearFieldError('street');
            }}
            placeholder="e.g. 12 Panchikawatte Road"
            error={fieldErrors.street}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="City"
              required
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearFieldError('city');
              }}
              placeholder="Colombo"
              error={fieldErrors.city}
            />
            <Select
              label="District"
              required
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              options={SRI_LANKA_DISTRICTS.map((item) => ({
                value: item,
                label: item,
              }))}
              error={fieldErrors.district}
            />
            <Select
              label="Province"
              required
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                clearFieldError('province');
              }}
              options={SRI_LANKA_PROVINCES.map((item) => ({
                value: item,
                label: item,
              }))}
              error={fieldErrors.province}
            />
            <Input
              label="Postal Code"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                clearFieldError('postalCode');
              }}
              placeholder="01000"
              helperText="5 digits (defaults to 00100)"
              error={fieldErrors.postalCode}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="min-h-[44px]"
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
