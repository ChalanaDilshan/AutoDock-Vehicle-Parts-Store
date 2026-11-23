import React, { useState, useEffect } from 'react';
import { adminSellerApi, SellerDocumentItem } from '../../api/identityApi.js';
import { X, ShieldAlert, Loader2, Lock, ExternalLink } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  document: SellerDocumentItem | null;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  document,
}) => {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document || !sellerId) {
      setViewUrl(null);
      setExpiresIn(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchUrl = async () => {
      try {
        const response = await adminSellerApi.getDocumentViewUrl(sellerId, document.documentId);
        if (isMounted) {
          if (response.success && response.data) {
            setViewUrl(response.data.viewUrl);
            setExpiresIn(response.data.expiresInSeconds);
          } else {
            setError(response.message || 'Failed to acquire presigned document view URL.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Access denied or document link generation failed.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sellerId, document]);

  // Countdown timer for presigned URL
  useEffect(() => {
    if (!expiresIn || expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  if (!isOpen || !document) return null;

  const isPdf = document.mimeType === 'application/pdf' || document.fileName.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-preview-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <div>
              <h3 id="doc-preview-title" className="font-bold text-slate-900 text-sm">
                Secure Document Review: {document.fileName}
              </h3>
              <p className="text-xs text-slate-500">
                Type: {document.documentType} | Size: {(document.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md transition"
            aria-label="Close document viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning & Expiration Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Strictly Confidential — Authorized Admin Dossier Inspection Only</span>
          </div>
          {expiresIn !== null && (
            <span className="font-mono font-medium text-amber-800">
              Link expires in: {expiresIn}s
            </span>
          )}
        </div>

        {/* Viewer Content */}
        <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Generating secure temporary token...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center max-w-md">
              <p className="text-sm font-semibold mb-1">Document Unavailable</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          {!isLoading && !error && viewUrl && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {isPdf ? (
                <iframe
                  src={viewUrl}
                  title="Document Preview"
                  className="w-full h-[550px] rounded border border-slate-300 bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="max-h-[550px] overflow-auto flex items-center justify-center bg-white p-2 rounded border border-slate-300">
                  <img
                    src={viewUrl}
                    alt={document.fileName}
                    className="max-h-[500px] w-auto object-contain rounded"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Temporary credentials expire automatically. No cached copies preserved.</span>
          <div className="flex items-center gap-2">
            {viewUrl && (
              <a
                href={viewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
              </a>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-white rounded hover:bg-slate-700 font-medium transition"
            >
              Done Reviewing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
