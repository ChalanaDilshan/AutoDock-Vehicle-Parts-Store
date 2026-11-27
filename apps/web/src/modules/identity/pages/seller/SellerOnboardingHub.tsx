import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, FileText } from 'lucide-react';
import {
  sellerApi,
  SellerProfileData,
  SellerDocumentItem,
  DocumentType,
} from '../../api/identityApi.js';
import { DocumentDropzone } from '../../components/DocumentDropzone.js';
import { PrivacyNoticeModal } from '../../components/PrivacyNoticeModal.js';
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
        }
        if (profileRes.data.hasPrivacyAcknowledgement) {
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

    if (!bankName.trim() || !accountHolderName.trim() || !accountNumber.trim() || !branchName.trim()) {
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
    if (checked && seller && !seller.hasPrivacyAcknowledgement) {
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

  const docsComplete =
    Boolean(brDoc && idDoc && faceDoc) && (!isPhysical || Boolean(storeDoc));
  const bankComplete = Boolean(seller.bankDetails);
  const canSubmit = docsComplete && bankComplete && privacyAgreed;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title={seller.businessName}
        subtitle={`${isPhysical ? 'Physical Retail Store' : 'Online-Only Merchant'} · Registration: ${seller.businessRegistrationNumber}`}
        badge={<Badge variant="primary">{seller.verificationStatus}</Badge>}
      />

      {actionError && <Alert variant="danger">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success">{actionSuccess}</Alert>}

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
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Building2 className="w-4 h-4 text-[#E11D30]" />
            <h2>2. Payout &amp; Direct Transfer Bank Account</h2>
          </div>
          {seller.bankDetails && (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved ({seller.bankDetails.maskedAccountNumber})</span>
            </Badge>
          )}
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
              required={!seller.bankDetails}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={seller.bankDetails ? 'Enter new number to replace' : 'Enter bank account number'}
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

        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="lg"
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
