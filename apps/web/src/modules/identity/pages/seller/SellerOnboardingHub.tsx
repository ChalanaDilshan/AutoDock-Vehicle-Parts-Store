import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
} from 'lucide-react';
import {
  sellerApi,
  SellerProfileData,
  SellerDocumentItem,
  DocumentType,
} from '../../api/identityApi.js';
import { DocumentDropzone } from '../../components/DocumentDropzone.js';
import { PrivacyNoticeModal } from '../../components/PrivacyNoticeModal.js';
import { CURRENT_PRIVACY_NOTICE_VERSION } from '../../constants/privacy.constants.js';
import {
  Alert,
  Badge,
  Button,
  Input,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerOnboardingHub: React.FC = () => {
  const navigate = useNavigate();

  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [documents, setDocuments] = useState<SellerDocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isAcknowledgingPrivacy, setIsAcknowledgingPrivacy] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [profileRes, docsRes] = await Promise.all([
        sellerApi.getMe(),
        sellerApi.getDocuments(),
      ]);
      if (profileRes.success && profileRes.data) {
        setSeller(profileRes.data);
        if (profileRes.data.bankDetails) {
          setBankName(profileRes.data.bankDetails.bankName || '');
          setAccountHolderName(profileRes.data.bankDetails.accountHolderName || '');
          setBranchName(profileRes.data.bankDetails.branchName || '');
          setBranchCode(profileRes.data.bankDetails.branchCode || '');
        }
        if (
          profileRes.data.hasPrivacyAcknowledgement ||
          profileRes.data.privacyAcknowledged
        ) {
          setPrivacyAgreed(true);
        }
      }
      if (docsRes.success && Array.isArray(docsRes.data)) {
        setDocuments(docsRes.data);
      }
    } catch (err: any) {
      if (err?.status === 404) {
        navigate('/sellers/register');
      } else {
        setActionError(err?.message || 'Failed to load seller onboarding dossier.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const findDoc = (type: DocumentType) =>
    documents.find((d) => d.documentType === type) || null;

  const handleUploadDocument = async (payload: {
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    fileContentBase64?: string;
  }) => {
    setActionError(null);
    const response = await sellerApi.uploadDocument(payload);
    if (response.success) {
      const docsRes = await sellerApi.getDocuments();
      if (docsRes.success && Array.isArray(docsRes.data)) {
        setDocuments(docsRes.data);
      }
      setActionSuccess(`Uploaded ${payload.fileName}.`);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (
      !bankName.trim() ||
      !accountHolderName.trim() ||
      !accountNumber.trim() ||
      !branchName.trim()
    ) {
      setActionError('All bank account fields are required.');
      return;
    }

    setIsSavingBank(true);
    try {
      const response = await sellerApi.submitBankDetails({
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        branchName: branchName.trim(),
        branchCode: branchCode.trim() || undefined,
      });
      if (response.success) {
        const pRes = await sellerApi.getMe();
        if (pRes.success && pRes.data) setSeller(pRes.data);
        setAccountNumber('');
        setActionSuccess('Bank account details saved securely.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Unable to save bank details.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    setPrivacyAgreed(checked);
    if (
      checked &&
      seller &&
      !seller.hasPrivacyAcknowledgement &&
      !seller.privacyAcknowledged
    ) {
      setIsAcknowledgingPrivacy(true);
      try {
        await sellerApi.acknowledgePrivacy({
          noticeVersion: CURRENT_PRIVACY_NOTICE_VERSION,
          acknowledged: true,
        });
        setSeller((prev) =>
          prev
            ? {
                ...prev,
                hasPrivacyAcknowledgement: true,
                privacyAcknowledged: true,
              }
            : prev
        );
      } catch (err: any) {
        setActionError(err?.message || 'Failed to record privacy acknowledgement.');
        setPrivacyAgreed(false);
      } finally {
        setIsAcknowledgingPrivacy(false);
      }
    }
  };

  const handleSubmitApplication = async () => {
    setActionError(null);
    setIsSubmittingApp(true);
    try {
      const response = await sellerApi.submitApplication();
      if (response.success) {
        navigate('/seller/onboarding/status');
      } else {
        setActionError(response.message || 'Submission failed.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Unable to submit application.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-96 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (!seller) return null;

  const isPhysical = seller.sellerType === 'PHYSICAL_STORE';
  const brDoc = findDoc('BUSINESS_REGISTRATION');
  const idDoc = findDoc('SELLER_ID_CARD');
  const faceDoc = findDoc('SELLER_FACE_PHOTO');
  const storeDoc = findDoc('STORE_PHOTO');

  const requiredDocsCount = isPhysical ? 4 : 3;
  const uploadedRequiredDocsCount =
    Number(Boolean(brDoc)) +
    Number(Boolean(idDoc)) +
    Number(Boolean(faceDoc)) +
    (isPhysical ? Number(Boolean(storeDoc)) : 0);

  const docsComplete = uploadedRequiredDocsCount === requiredDocsCount;
  const bankComplete =
    Boolean(seller.bankDetails) ||
    (Boolean(seller.bankVerificationStatus) &&
      seller.bankVerificationStatus !== 'UNSUBMITTED');
  const privacyComplete = Boolean(
    privacyAgreed ||
      seller.hasPrivacyAcknowledgement ||
      seller.privacyAcknowledged
  );
  const isApproved = seller.verificationStatus === 'APPROVED';
  const isAdditionalInfoRequired =
    seller.verificationStatus === 'ADDITIONAL_INFO_REQUIRED';
  const isRejected = seller.verificationStatus === 'REJECTED';
  const isSubmittedOrLater =
    seller.verificationStatus === 'PENDING' ||
    seller.verificationStatus === 'UNDER_VERIFICATION' ||
    isApproved;

  const canSubmit = docsComplete && bankComplete && privacyComplete && !isApproved;

  const checklistItems = [
    {
      id: 'profile',
      label: 'Store profile created',
      detail: `${seller.businessName} (${isPhysical ? 'Physical Store' : 'Online-Only'})`,
      done: true,
      needsAttention: false,
    },
    {
      id: 'documents',
      label: 'Required verification documents uploaded',
      detail: `${uploadedRequiredDocsCount} of ${requiredDocsCount} required documents uploaded`,
      done: docsComplete,
      needsAttention: false,
    },
    {
      id: 'bank',
      label: 'Bank account details saved',
      detail: bankComplete
        ? seller.bankDetails?.maskedAccountNumber
          ? `Saved (${seller.bankDetails.maskedAccountNumber})`
          : `Status: ${seller.bankVerificationStatus || 'Saved'}`
        : 'Add Sri Lankan bank account details below',
      done: bankComplete,
      needsAttention: seller.bankVerificationStatus === 'REJECTED' || seller.bankDetails?.verificationStatus === 'REJECTED',
    },
    {
      id: 'privacy',
      label: 'Privacy notice acknowledged',
      detail: privacyComplete ? 'Version 1.2 accepted' : 'Review and accept notice below',
      done: privacyComplete,
      needsAttention: false,
    },
    {
      id: 'submitted',
      label: 'Application submitted',
      detail: isApproved
        ? 'Store approved'
        : isSubmittedOrLater
          ? `Current status: ${seller.verificationStatus}`
          : isAdditionalInfoRequired
            ? 'Updates requested: update items and resubmit'
            : isRejected
              ? 'Not approved: update items and resubmit'
              : 'Pending submission',
      done: isSubmittedOrLater,
      needsAttention: isAdditionalInfoRequired || isRejected,
    },
  ];

  const completedStepsCount = checklistItems.filter((item) => item.done).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title={seller.businessName}
        subtitle={`${isPhysical ? 'Physical Retail Store' : 'Online-Only Merchant'} · Registration: ${seller.businessRegistrationNumber}`}
        badge={
          <Badge variant={isApproved ? 'success' : isAdditionalInfoRequired || isRejected ? 'warning' : 'primary'}>
            {seller.verificationStatus}
          </Badge>
        }
      />

      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

      {isAdditionalInfoRequired && (
        <Alert variant="warning" title="Additional Information Requested">
          {seller.additionalInfoRequested ||
            'An administrator requested updates to your verification details. Update the relevant documents or bank details below and resubmit.'}
        </Alert>
      )}

      {isRejected && (
        <Alert variant="danger" title="Application Requires Updates">
          {seller.rejectionReason ||
            'Your previous submission was not approved. Update the affected documents or bank details and resubmit your application.'}
        </Alert>
      )}

      {(seller.verificationStatus === 'PENDING' ||
        seller.verificationStatus === 'UNDER_VERIFICATION') && (
        <Alert variant="info" title="Application Submitted for Review">
          Your store dossier is queued for administrative verification.{' '}
          <Link to="/seller/onboarding/status" className="font-semibold underline">
            View application status
          </Link>
        </Alert>
      )}

      {isApproved && (
        <Alert variant="success" title="Store Verification Approved">
          Your store profile has been approved.{' '}
          <Link to="/seller/dashboard" className="font-semibold underline">
            Open Seller Portal
          </Link>
        </Alert>
      )}

      {/* Visual Onboarding Completion Checklist */}
      <section
        aria-label="Onboarding completion checklist"
        className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Onboarding Completion Checklist
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Complete all steps below to submit your merchant store for verification.
            </p>
          </div>
          <Badge variant={completedStepsCount === 5 ? 'success' : 'primary'}>
            {completedStepsCount} of 5 completed
          </Badge>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {checklistItems.map((item, idx) => (
            <li
              key={item.id}
              className={`rounded-lg border p-3 flex flex-col justify-between gap-2 ${
                item.done
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : item.needsAttention
                    ? 'border-amber-200 bg-amber-50/60'
                    : 'border-slate-200 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  STEP 0{idx + 1}
                </span>
                {item.done ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-700 shrink-0"
                    aria-label="Completed"
                  />
                ) : item.needsAttention ? (
                  <AlertCircle
                    className="w-4 h-4 text-amber-700 shrink-0"
                    aria-label="Action needed"
                  />
                ) : item.id === 'submitted' && isSubmittedOrLater ? (
                  <Clock className="w-4 h-4 text-[#E11D30] shrink-0" aria-hidden="true" />
                ) : (
                  <Circle
                    className="w-4 h-4 text-slate-400 shrink-0"
                    aria-label="Pending"
                  />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-900 leading-snug">
                  {item.label}
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Storefront Exemption Notice for Online-Only */}
      {!isPhysical && (
        <Alert variant="info" title="Storefront Photos Not Required">
          Because your business operates as an Online-Only Merchant, storefront photographs are not needed. Complete identity verification and bank setup below.
        </Alert>
      )}

      {/* Step 1: Required Documents */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <FileText className="w-4 h-4 text-[#E11D30]" />
          <h2>1. Verification Documents</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentDropzone
            label="Business Registration Certificate"
            description="Official Sri Lankan BR certificate matching store name"
            documentType="BUSINESS_REGISTRATION"
            currentDocument={brDoc}
            onUpload={handleUploadDocument}
          />
          <DocumentDropzone
            label="National Identity Card / Passport"
            description="Clear front copy of owner or authorized director ID"
            documentType="SELLER_ID_CARD"
            currentDocument={idDoc}
            onUpload={handleUploadDocument}
          />
          <DocumentDropzone
            label="Owner Live Verification Photo"
            description="Recent clear headshot photo of the primary business owner"
            documentType="SELLER_FACE_PHOTO"
            currentDocument={faceDoc}
            onUpload={handleUploadDocument}
          />
          {isPhysical && (
            <DocumentDropzone
              label="Physical Storefront & Workshop Photographs"
              description="Photo showing shop signage and spare-parts counter"
              documentType="STORE_PHOTO"
              currentDocument={storeDoc}
              onUpload={handleUploadDocument}
            />
          )}
        </div>
      </section>

      {/* Step 2: Bank Account Details */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Building2 className="w-4 h-4 text-[#E11D30]" />
            <h2>2. Payout &amp; Direct Transfer Bank Account</h2>
          </div>
          {seller.bankDetails ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved ({seller.bankDetails.maskedAccountNumber})</span>
            </Badge>
          ) : bankComplete ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved ({seller.bankVerificationStatus})</span>
            </Badge>
          ) : null}
        </div>

        <form onSubmit={handleSaveBank} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Bank Name"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. Commercial Bank of Ceylon"
            />
            <Input
              label="Branch Name"
              required
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Panchikawatte"
            />
            <Input
              label="Account Holder Name"
              required
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Must match registered business or owner"
            />
            <Input
              label="Account Number"
              required={!bankComplete}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={
                bankComplete
                  ? 'Enter new number to replace'
                  : 'Enter bank account number'
              }
            />
            <Input
              label="Branch Code (Optional)"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="e.g. 045"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" isLoading={isSavingBank}>
              Save Bank Details
            </Button>
          </div>
        </form>
      </section>

      {/* Step 3: Privacy & Submission */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <input
            id="privacy-ack-checkbox"
            type="checkbox"
            checked={privacyAgreed}
            disabled={isAcknowledgingPrivacy}
            onChange={(e) => handlePrivacyToggle(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-[#E11D30] focus:ring-[#E11D30]"
          />
          <div className="text-sm text-slate-700 leading-relaxed">
            <label htmlFor="privacy-ack-checkbox" className="cursor-pointer">
              I acknowledge and agree to the AutoDock Seller Privacy Notice (Version 1.2) governing identity document storage and settlement verification.
            </label>{' '}
            <button
              type="button"
              onClick={() => setIsPrivacyModalOpen(true)}
              className="font-medium text-[#E11D30] hover:underline"
            >
              Read full notice
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-600">
            {isAdditionalInfoRequired
              ? 'After updating your requested documents or bank details, resubmit your application for review.'
              : 'All required documents, bank details, and privacy notice must be completed before submission.'}
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="min-h-[44px]"
            disabled={!canSubmit}
            isLoading={isSubmittingApp}
            onClick={handleSubmitApplication}
          >
            Submit Application for Administrative Verification
          </Button>
        </div>
      </section>

      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
};
