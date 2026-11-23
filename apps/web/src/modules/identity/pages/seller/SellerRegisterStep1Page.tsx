import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { sellerApi, SellerStoreType } from '../../api/identityApi.js';
import { StoreTypeSelector } from '../../components/StoreTypeSelector.js';
import { Building2, MapPin, Phone, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const SellerRegisterStep1Page: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [sellerType, setSellerType] = useState<SellerStoreType>('PHYSICAL_STORE');
  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [brNumber, setBrNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('Colombo');
  const [province, setProvince] = useState('Western');
  const [postalCode, setPostalCode] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate slug from business name
  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name);
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setStoreSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!businessName || !storeSlug || !brNumber || !street || !city || !district || !province || !postalCode || !contactPhone) {
      setErrorMessage('Please fill in all required business and operating address fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await sellerApi.registerProfile({
        businessName: businessName.trim(),
        storeSlug: storeSlug.trim(),
        sellerType,
        businessRegistrationNumber: brNumber.trim(),
        operatingAddress: {
          street: street.trim(),
          city: city.trim(),
          district: district.trim(),
          province: province.trim(),
          postalCode: postalCode.trim(),
        },
        contactPhone: contactPhone.trim(),
      });

      if (response.success) {
        await refreshProfile();
        navigate('/seller/onboarding');
      } else {
        setErrorMessage(response.message || 'Failed to initialize seller profile.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error registering seller profile. Store slug may already be taken.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
        <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Sell on AutoDock</h2>
        <p className="text-xs text-slate-600 mb-6">
          To register a seller storefront and verify your spare-parts dealership, please sign in or create an account first.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login"
            state={{ from: { pathname: '/sellers/register' } }}
            className="px-5 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition"
          >
            Sign In to Continue
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Create Customer Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Merchant Onboarding (Step 1 of 4)</span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Register Your Spare-Parts Business</h1>
          <p className="text-xs text-slate-500 mt-1">
            Join Sri Lanka's verified automotive spare-parts network. Select your operating model and submit initial company details.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-md flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Type Selector */}
          <StoreTypeSelector value={sellerType} onChange={setSellerType} disabled={isSubmitting} />

          {/* Business Information Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" /> Commercial Registration Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="biz-name" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="biz-name"
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="E.g. Colombo Auto Spares (Pvt) Ltd"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="biz-slug" className="block text-xs font-semibold text-slate-700 mb-1">
                  Storefront URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-xs">
                    autodock.lk/
                  </span>
                  <input
                    id="biz-slug"
                    type="text"
                    required
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase())}
                    placeholder="colombo-auto-spares"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="biz-br" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Registration (BR) Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="biz-br"
                  type="text"
                  required
                  value={brNumber}
                  onChange={(e) => setBrNumber(e.target.value.toUpperCase())}
                  placeholder="E.g. PV-00214589"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="biz-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                  Business Contact Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="biz-phone"
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+94 11 234 5678"
                    className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Address Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Operating Premises Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="addr-street" className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="addr-street"
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="No. 142, Panchikawatte Road"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="addr-city" className="block text-xs font-semibold text-slate-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="addr-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Colombo 10"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="addr-district" className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  id="addr-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Colombo">Colombo</option>
                  <option value="Gampaha">Gampaha</option>
                  <option value="Kalutara">Kalutara</option>
                  <option value="Kandy">Kandy</option>
                  <option value="Matale">Matale</option>
                  <option value="Nuwara Eliya">Nuwara Eliya</option>
                  <option value="Galle">Galle</option>
                  <option value="Matara">Matara</option>
                  <option value="Hambantota">Hambantota</option>
                  <option value="Jaffna">Jaffna</option>
                  <option value="Kilinochchi">Kilinochchi</option>
                  <option value="Mannar">Mannar</option>
                  <option value="Vavuniya">Vavuniya</option>
                  <option value="Mullaitivu">Mullaitivu</option>
                  <option value="Batticaloa">Batticaloa</option>
                  <option value="Ampara">Ampara</option>
                  <option value="Trincomalee">Trincomalee</option>
                  <option value="Kurunegala">Kurunegala</option>
                  <option value="Puttalam">Puttalam</option>
                  <option value="Anuradhapura">Anuradhapura</option>
                  <option value="Polonnaruwa">Polonnaruwa</option>
                  <option value="Badulla">Badulla</option>
                  <option value="Monaragala">Monaragala</option>
                  <option value="Ratnapura">Ratnapura</option>
                  <option value="Kegalle">Kegalle</option>
                </select>
              </div>

              <div>
                <label htmlFor="addr-province" className="block text-xs font-semibold text-slate-700 mb-1">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  id="addr-province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Southern">Southern</option>
                  <option value="Northern">Northern</option>
                  <option value="Eastern">Eastern</option>
                  <option value="North Western">North Western</option>
                  <option value="North Central">North Central</option>
                  <option value="Uva">Uva</option>
                  <option value="Sabaragamuwa">Sabaragamuwa</option>
                </select>
              </div>

              <div>
                <label htmlFor="addr-postal" className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="addr-postal"
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="01000"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Next step: Upload Business Registration & Identity media
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue to Documents</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
