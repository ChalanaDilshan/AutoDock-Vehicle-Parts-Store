import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  adminSellerApi,
  SellerProfileData,
  SellerDocumentItem,
} from '../../api/identityApi.js';
import { DocumentPreviewModal } from '../../components/admin/DocumentPreviewModal.js';
import { VerificationDecisionModal } from '../../components/admin/VerificationMethodModal.js';
import { BankVerificationModal } from '../../components/admin/BankVerificationModal.js';
import {
  ShieldCheck,
  Building2,
  MapPin,
  FileText,
  CreditCard,
  History,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
} from 'lucide-react';

export const SellerApplicationReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Modals state
  const [activePreviewDoc, setActivePreviewDoc] = useState<SellerDocumentItem | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const loadDossier = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await adminSellerApi.getApplicationDetail(id);
      if (response.success && response.data) {
        setSeller(response.data);
      } else {
        setErrorMessage(response.message || 'Failed to retrieve application dossier.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Access denied or seller dossier not found.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDossier();
  }, [loadDossier]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Retrieving seller verification dossier...</p>
      </div>
    );
  }

  if (errorMessage || !seller) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-xl border border-red-200 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 mb-1">Dossier Unavailable</h2>
        <p className="text-xs text-slate-600 mb-4">{errorMessage || 'Seller application not found.'}</p>
        <Link
          to="/admin/sellers/verification"
          className="inline-flex items-center gap-1 text-xs text-blue-600 underline font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Queue
        </Link>
      </div>
    );
  }

  const isPhysical = seller.sellerType === 'PHYSICAL_STORE';

  // Handle Verification Review Submit
  const handleReviewDecision = async (payload: {
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    verificationMethod?: 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';
    verificationNotes: string;
  }) => {
    if (!id) return;
    const response = await adminSellerApi.reviewApplication(id, payload);
    if (response.success) {
      setSuccessFeedback(`Application status successfully updated to: ${response.data.verificationStatus}`);
      await loadDossier();
    }
  };

  // Handle Bank Verify Submit
  const handleBankVerify = async (payload: { decision: 'VERIFY' | 'REJECT'; rejectionReason?: string }) => {
    if (!id) return;
    const response = await adminSellerApi.verifyBankDetails(id, payload);
    if (response.success) {
      setSuccessFeedback(`Bank verification status updated to: ${response.data.verificationStatus}`);
      await loadDossier();
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-6 space-y-6">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          to="/admin/sellers/verification"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Verification Workstation Queue
        </Link>
      </div>

      {successFeedback && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successFeedback}</span>
          </div>
          <button
            onClick={() => setSuccessFeedback(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dossier Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Seller Application Dossier
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                isPhysical
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isPhysical ? 'Physical Retail Store' : 'Online-Only Merchant'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
              Status: {seller.verificationStatus}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{seller.businessName}</h1>
          <p className="text-xs text-slate-500">
            BR Number: <span className="font-mono font-medium text-slate-700">{seller.businessRegistrationNumber}</span> | Slug: autodock.lk/{seller.storeSlug}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsDecisionModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" /> Record Verification Decision
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Commercial & Premises Details */}
        <div className="space-y-6">
          {/* Business & Owner Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Commercial Profile
            </h2>
            <div className="text-xs space-y-2">
              <div>
                <span className="text-slate-400 block">Registered Entity:</span>
                <span className="font-semibold text-slate-900">{seller.businessName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Business Reg (BR):</span>
                <span className="font-mono font-semibold text-slate-900">{seller.businessRegistrationNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Storefront URL:</span>
                <span className="font-medium text-blue-600">autodock.lk/{seller.storeSlug}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Contact Phone:</span>
                <span className="font-medium text-slate-800">{seller.contactPhone}</span>
              </div>
              {seller.user && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block">Primary Account Holder:</span>
                  <span className="font-semibold text-slate-900">
                    {seller.user.firstName} {seller.user.lastName}
                  </span>
                  <span className="block text-[11px] text-slate-500">{seller.user.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Operating Address */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Operating Location
            </h2>
            <div className="text-xs text-slate-700 leading-relaxed">
              <p className="font-medium text-slate-900">{seller.operatingAddress.street}</p>
              <p>
                {seller.operatingAddress.city}, {seller.operatingAddress.district}
              </p>
              <p>
                {seller.operatingAddress.province} Province, Postal: {seller.operatingAddress.postalCode}
              </p>
            </div>
            {isPhysical && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-[11px] text-blue-900">
                <strong>Physical Inspection Target:</strong> Location eligible for physical inspection visit or WhatsApp video call verification.
              </div>
            )}
          </div>

          {/* Bank Account Overview */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" /> Bank Settlement
              </h2>
              {seller.bankDetails && (
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  Audit Bank
                </button>
              )}
            </div>

            {seller.bankDetails ? (
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank:</span>
                  <span className="font-semibold text-slate-800">{seller.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holder:</span>
                  <span className="font-semibold text-slate-800">{seller.bankDetails.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Masked Acc:</span>
                  <span className="font-mono font-semibold text-slate-900">{seller.bankDetails.maskedAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Branch:</span>
                  <span className="font-medium text-slate-800">{seller.bankDetails.branchName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-400">Audit Status:</span>
                  <span
                    className={`font-bold ${
                      seller.bankDetails.verificationStatus === 'VERIFIED'
                        ? 'text-emerald-700'
                        : seller.bankDetails.verificationStatus === 'REJECTED'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {seller.bankDetails.verificationStatus}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No bank credentials submitted yet.</p>
            )}
          </div>
        </div>

        {/* Right Columns: Confidential Document Review & Verification History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Confidential Verification Media ({seller.documents?.length || 0})
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Presigned viewing credentials expire in 60s
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Click &quot;Inspect Document&quot; to securely generate a temporary, access-controlled viewing link. Never distribute confidential merchant files.
            </p>

            <div className="space-y-3">
              {seller.documents && seller.documents.length > 0 ? (
                seller.documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{doc.fileName}</div>
                        <div className="text-[11px] text-slate-500">
                          {doc.documentType} • {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActivePreviewDoc(doc)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Document</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No verification documents submitted for this application.
                </div>
              )}
            </div>
          </div>

          {/* Verification Audit Timeline */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              Administrative Verification History & Inspection Audit Log
            </h2>

            {seller.verificationHistory && seller.verificationHistory.length > 0 ? (
              <div className="space-y-3">
                {seller.verificationHistory.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Decision: {item.decision}</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                    {item.verificationMethod && (
                      <div className="text-[11px] text-blue-800 font-medium">
                        Verification Method: {item.verificationMethod}
                      </div>
                    )}
                    <p className="text-slate-600 whitespace-pre-wrap">{item.verificationNotes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous verification audits recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Secure Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(activePreviewDoc)}
        onClose={() => setActivePreviewDoc(null)}
        sellerId={seller.sellerId}
        document={activePreviewDoc}
      />

      {/* Verification Decision Modal */}
      <VerificationDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        seller={seller}
        onConfirm={handleReviewDecision}
      />

      {/* Bank Verification Modal */}
      <BankVerificationModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        seller={seller}
        onConfirm={handleBankVerify}
      />
    </div>
  );
};
