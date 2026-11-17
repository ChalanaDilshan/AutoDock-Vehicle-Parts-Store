import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  sellerApi,
  SellerProfileData,
  SellerDocumentItem,
  DocumentType,
} from '../../api/identityApi.js';
import { DocumentDropzone } from '../../components/DocumentDropzone.js';
import { PrivacyNoticeModal } from '../../components/PrivacyNoticeModal.js';
import {
  ShieldCheck,
  FileText,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const SellerOnboardingHub: React.FC = () => {
  const navigate = useNavigate();

  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [documents, setDocuments] = useState<SellerDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  // Bank Form State
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);
  const [bankSavedSuccess, setBankSavedSuccess] = useState(false);

  // Privacy State (MUST start unchecked)
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAcknowledgingPrivacy, setIsAcknowledgingPrivacy] = useState(false);

  // Final Submission
  const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, docsRes] = await Promise.all([
        sellerApi.getMe(),
        sellerApi.getDocuments(),
      ]);

      if (profileRes.success && profileRes.data) {
        setSeller(profileRes.data);
        if (profileRes.data.bankDetails) {
          setBankName(profileRes.data.bankDetails.bankName || '');
          setAccountHolder(profileRes.data.bankDetails.accountHolderName || '');
          setBranchName(profileRes.data.bankDetails.branchName || '');
        }
        if (profileRes.data.hasPrivacyAcknowledgement) {
          setPrivacyAgreed(true);
        }
      }

      if (docsRes.success && docsRes.data) {
        setDocuments(docsRes.data);
      }
    } catch (err: any) {
      if (err?.status === 404) {
        // No seller profile exists yet -> redirect to Step 1
        navigate('/sellers/register');
      } else {
        setActionError(err?.message || 'Failed to load seller onboarding dossier.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading seller onboarding dossier...</p>
      </div>
    );
  }

  if (!seller) return null;

  // If already submitted (PENDING, UNDER_VERIFICATION, APPROVED, REJECTED), forward to status view
  if (['PENDING', 'UNDER_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED'].includes(seller.verificationStatus)) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
        <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Application Already Submitted</h2>
        <p className="text-xs text-slate-600 mb-4">
          Your merchant application is currently in status:{' '}
          <span className="font-semibold text-blue-700">{seller.verificationStatus}</span>.
        </p>
        <Link
          to="/seller/onboarding/status"
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
        >
          View Verification Status & Timeline <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Document matching helpers
  const getDoc = (type: DocumentType) => documents.find((d) => d.documentType === type);

  const hasBR = Boolean(getDoc('BUSINESS_REGISTRATION'));
  const hasNIC = Boolean(getDoc('SELLER_ID_CARD'));
  const hasFace = Boolean(getDoc('SELLER_FACE_PHOTO'));
  const hasStorePhoto = Boolean(getDoc('STORE_PHOTO'));

  const isPhysical = seller.sellerType === 'PHYSICAL_STORE';
  const documentsComplete = isPhysical
    ? hasBR && hasNIC && hasFace && hasStorePhoto
    : hasBR && hasNIC && hasFace;

  const bankComplete = Boolean(seller.bankDetails);

  const canSubmit = documentsComplete && bankComplete && privacyAgreed;

  // Handle Document Upload
  const handleDocUpload = async (payload: {
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    fileContentBase64: string;
  }) => {
    setActionError(null);
    try {
      const response = await sellerApi.uploadDocument(payload);
      if (response.success && response.data) {
        // Refresh documents list
        const docsRes = await sellerApi.getDocuments();
        if (docsRes.success && docsRes.data) {
          setDocuments(docsRes.data);
        }
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to upload verification document.');
      throw err;
    }
  };

  // Handle Bank Submit
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!bankName || !accountHolder || !accountNumber || !branchName) {
      setActionError('Please complete all bank credential fields.');
      return;
    }

    setIsSubmittingBank(true);
    try {
      const response = await sellerApi.submitBankDetails({
        bankName: bankName.trim(),
        accountHolderName: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        branchName: branchName.trim(),
      });

      if (response.success) {
        setBankSavedSuccess(true);
        // Reload seller
        const pRes = await sellerApi.getMe();
        if (pRes.success) setSeller(pRes.data);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to record bank details.');
    } finally {
      setIsSubmittingBank(false);
    }
  };

  // Handle Privacy Notice Toggle
  const handlePrivacyToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setPrivacyAgreed(checked);

    if (checked && !seller.hasPrivacyAcknowledgement) {
      setIsAcknowledgingPrivacy(true);
      try {
        await sellerApi.acknowledgePrivacy({
          noticeVersion: 'v1.2',
          acknowledged: true,
        });
      } catch (err: any) {
        setActionError(err?.message || 'Failed to record privacy acknowledgement.');
        setPrivacyAgreed(false);
      } finally {
        setIsAcknowledgingPrivacy(false);
      }
    }
  };

  // Handle Final Submission
  const handleFinalSubmit = async () => {
    if (!canSubmit) return;
    setActionError(null);
    setIsFinalSubmitting(true);

    try {
      const response = await sellerApi.submitApplication();
      if (response.success) {
        navigate('/seller/onboarding/status');
      } else {
        setActionError(response.message || 'Submission failed.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to finalize application submission.');
    } finally {
      setIsFinalSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-8">
      {/* Dossier Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Merchant Verification Hub
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                isPhysical
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isPhysical ? 'Physical Retail Store' : 'Online-Only Merchant'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{seller.businessName}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BR Number: <span className="font-mono font-medium text-slate-700">{seller.businessRegistrationNumber}</span> | Slug: autodock.lk/{seller.storeSlug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/sellers/register"
            className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded font-medium hover:bg-slate-50 transition"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* SECTION 1: CONFIDENTIAL VERIFICATION DOCUMENTS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Step 2: Verification Documents</h2>
          </div>
          <span className="text-xs text-slate-500">
            {documents.length} / {isPhysical ? 4 : 3} Uploaded
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Upload clear, un-edited scans or photographs in PDF, JPEG, or PNG formats (maximum 10MB each).
          Documents are stored securely in private storage and reviewed exclusively by authorized administrators.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Document 1: BR Certificate */}
          <DocumentDropzone
            label="Business Registration (BR) Certificate"
            description="Official certificate from Registrar of Companies or Divisional Secretariat"
            documentType="BUSINESS_REGISTRATION"
            required={true}
            currentDocument={getDoc('BUSINESS_REGISTRATION')}
            onUpload={handleDocUpload}
          />

          {/* Document 2: NIC or Passport */}
          <DocumentDropzone
            label="Seller National ID (NIC) / Passport"
            description="Clear copy of both sides of owner/director NIC or passport identity page"
            documentType="SELLER_ID_CARD"
            required={true}
            currentDocument={getDoc('SELLER_ID_CARD')}
            onUpload={handleDocUpload}
          />

          {/* Document 3: Face Photo */}
          <DocumentDropzone
            label="Seller Face Photo / Live Selfie"
            description="Recent clear face photograph for biometric identity verification"
            documentType="SELLER_FACE_PHOTO"
            required={true}
            currentDocument={getDoc('SELLER_FACE_PHOTO')}
            onUpload={handleDocUpload}
          />

          {/* Document 4: Physical Storefront Photos (CONDITIONAL: ONLY FOR PHYSICAL_STORE) */}
          {isPhysical ? (
            <DocumentDropzone
              label="Physical Storefront & Workshop Photographs"
              description="Exterior shop signboard and interior automotive parts stock shelves"
              documentType="STORE_PHOTO"
              required={true}
              currentDocument={getDoc('STORE_PHOTO')}
              onUpload={handleDocUpload}
            />
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center text-center text-slate-500">
              <Info className="w-6 h-6 text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-700">Storefront Photos Not Required</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                As an Online-Only Merchant operating without a walk-in retail counter, physical storefront photographs are exempt from verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: SELLER BANK ACCOUNT DETAILS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Step 3: Merchant Bank Settlement Account</h2>
          </div>
          {seller.bankDetails && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Saved ({seller.bankDetails.verificationStatus})
            </span>
          )}
        </div>

        {/* Bank Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Important Notice:</span> Customer direct bank-transfer checkout will not disburse funds to your account until an administrator verifies that the account holder matches your registered business name or sole proprietor identity.
          </p>
        </div>

        {seller.bankDetails && !bankSavedSuccess ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Bank Details on Record:</span>
              <span className="text-xs text-slate-500 font-medium">Status: {seller.bankDetails.verificationStatus}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 block">Bank:</span>
                <span className="font-medium text-slate-800">{seller.bankDetails.bankName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Account Holder:</span>
                <span className="font-medium text-slate-800">{seller.bankDetails.accountHolderName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Account Number:</span>
                <span className="font-mono font-medium text-slate-900">{seller.bankDetails.maskedAccountNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Branch:</span>
                <span className="font-medium text-slate-800">{seller.bankDetails.branchName}</span>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleBankSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bank-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                id="bank-name"
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="E.g., Commercial Bank of Ceylon PLC"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bank-holder" className="block text-xs font-semibold text-slate-700 mb-1">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                id="bank-holder"
                type="text"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Must match registered business name"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bank-acc-num" className="block text-xs font-semibold text-slate-700 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                id="bank-acc-num"
                type="password"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Full account number (will be masked after save)"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor="bank-branch" className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Branch <span className="text-red-500">*</span>
              </label>
              <input
                id="bank-branch"
                type="text"
                required
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="E.g., Panchikawatte Branch"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmittingBank}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmittingBank ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Credentials...</span>
                </>
              ) : (
                <span>Save Bank Account</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: PRIVACY NOTICE ACKNOWLEDGEMENT & FINAL SUBMIT */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Step 4: Privacy Acknowledgement & Final Submission</h2>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
          <div className="flex items-start gap-3">
            <input
              id="privacy-checkbox"
              type="checkbox"
              checked={privacyAgreed}
              onChange={handlePrivacyToggle}
              disabled={isAcknowledgingPrivacy}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="privacy-checkbox" className="text-xs text-slate-700 leading-normal cursor-pointer">
              <span className="font-semibold text-slate-900">
                I acknowledge and agree to the AutoDock Seller Privacy Notice (Version 1.2).
              </span>{' '}
              I understand that my identity documents and bank account credentials will be processed solely for verification and direct payment disbursement.
            </label>
          </div>

          <div className="pl-7">
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline inline-flex items-center gap-1"
            >
              Read Full Seller Privacy Notice (v1.2)
            </button>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
          <div className={`p-2.5 rounded border flex items-center gap-2 ${documentsComplete ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <CheckCircle2 className={`w-4 h-4 ${documentsComplete ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Documents ({isPhysical ? '4/4' : '3/3'})</span>
          </div>

          <div className={`p-2.5 rounded border flex items-center gap-2 ${bankComplete ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <CheckCircle2 className={`w-4 h-4 ${bankComplete ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Bank Account Provided</span>
          </div>

          <div className={`p-2.5 rounded border flex items-center gap-2 ${privacyAgreed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <CheckCircle2 className={`w-4 h-4 ${privacyAgreed ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Privacy Notice Accepted</span>
          </div>
        </div>

        {/* Final Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {!canSubmit && 'All required documents, bank details, and privacy consent must be completed to submit.'}
          </span>
          <button
            type="button"
            disabled={!canSubmit || isFinalSubmitting}
            onClick={handleFinalSubmit}
            className={`py-3 px-6 rounded-md text-xs font-bold transition flex items-center gap-2 shadow-sm ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isFinalSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application for Administrative Verification</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Privacy Notice Modal */}
      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        version="v1.2"
      />
    </div>
  );
};
