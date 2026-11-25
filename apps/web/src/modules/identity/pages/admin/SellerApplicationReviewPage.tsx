import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Building2, CheckCircle2, FileText } from 'lucide-react';
import {
  adminSellerApi,
  SellerProfileData,
  SellerDocumentItem,
} from '../../api/identityApi.js';
import { DocumentPreviewModal } from '../../components/admin/DocumentPreviewModal.js';
import { BankVerificationModal } from '../../components/admin/BankVerificationModal.js';
import { VerificationDecisionModal } from '../../components/admin/VerificationMethodModal.js';
import {
  Alert,
  Badge,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewDoc, setPreviewDoc] = useState<SellerDocumentItem | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);

  const loadDossier = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminSellerApi.getApplicationDetail(id);
      if (res.success && res.data) {
        setSeller(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load seller application dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [id]);

  const handleVerifyBank = async (payload: {
    decision: 'VERIFY' | 'REJECT';
    rejectionReason?: string;
  }) => {
    if (!id) return;
    await adminSellerApi.verifyBankDetails(id, payload);
    await loadDossier();
  };

  const handleReviewDecision = async (payload: {
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    verificationMethod?: 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';
    verificationNotes: string;
  }) => {
    if (!id) return;
    await adminSellerApi.reviewApplication(id, payload);
    await loadDossier();
  };

  if (isLoading) {
    return <div className="h-96 bg-white border border-slate-200 rounded-lg" />;
  }

  if (errorMessage || !seller) {
    return (
      <Alert variant="danger">
        {errorMessage || 'Seller application not found.'}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={seller.businessName}
        subtitle={`BR #${seller.businessRegistrationNumber} · ${seller.sellerType === 'PHYSICAL_STORE' ? 'Physical Store' : 'Online-Only Merchant'}`}
        backTo="/admin/sellers/verification"
        backLabel="Verification Queue"
        badge={<Badge variant="primary">{seller.verificationStatus}</Badge>}
        actions={
          <Button
            variant="primary"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => setDecisionModalOpen(true)}
          >
            Record Verification Decision
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Business & Contact Summary + Documents */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Applicant &amp; Store Summary
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Primary Contact</dt>
                <dd className="font-medium text-slate-900">
                  {seller.user
                    ? `${seller.user.firstName} ${seller.user.lastName}`
                    : 'Authorized Applicant'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900">{seller.contactPhone}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">
                  {seller.user?.email || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Operating Address</dt>
                <dd className="font-medium text-slate-900">
                  {seller.operatingAddress.street}, {seller.operatingAddress.city},{' '}
                  {seller.operatingAddress.district}
                </dd>
              </div>
            </dl>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">
                Confidential Verification Documents
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {(!seller.documents || seller.documents.length === 0) ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  No documents uploaded yet.
                </div>
              ) : (
                seller.documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {doc.fileName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {doc.documentType} &middot; {doc.reviewStatus}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setPreviewDoc(doc)}
                    >
                      Inspect Document
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right: Bank Audit & History */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Building2 className="w-4 h-4 text-slate-500" />
                <h2>Bank Settlement Account</h2>
              </div>
              {seller.bankDetails && (
                <Badge
                  variant={
                    seller.bankDetails.verificationStatus === 'VERIFIED'
                      ? 'success'
                      : seller.bankDetails.verificationStatus === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {seller.bankDetails.verificationStatus}
                </Badge>
              )}
            </div>

            {seller.bankDetails ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Bank &amp; Branch</span>
                  <span className="font-medium text-slate-900">
                    {seller.bankDetails.bankName} — {seller.bankDetails.branchName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Account Holder</span>
                  <span className="font-medium text-slate-900">
                    {seller.bankDetails.accountHolderName}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Account Number</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {seller.bankDetails.maskedAccountNumber}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setBankModalOpen(true)}
                >
                  Audit Bank
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Seller has not submitted bank details yet.
              </p>
            )}
          </section>

          {seller.verificationHistory && seller.verificationHistory.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Verification History
              </h2>
              <div className="space-y-3">
                {seller.verificationHistory.map((item, idx) => (
                  <div key={idx} className="text-xs border-l-2 border-slate-300 pl-3 space-y-0.5">
                    <div className="font-semibold text-slate-900">{item.decision}</div>
                    <div className="text-slate-600">{item.verificationNotes}</div>
                    <div className="text-slate-400">
                      {new Date(item.reviewedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        sellerId={seller.sellerId}
        document={previewDoc}
      />

      <BankVerificationModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        seller={seller}
        onConfirm={handleVerifyBank}
      />

      <VerificationDecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        seller={seller}
        onConfirm={handleReviewDecision}
      />
    </div>
  );
};
