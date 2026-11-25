import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { SellerDocumentItem, adminSellerApi } from '../../api/identityApi.js';
import { Alert, Button, Modal } from '../../../../shared/components/index.js';

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
    if (!isOpen || !document) return;
    setIsLoading(true);
    setError(null);
    setViewUrl(null);

    adminSellerApi
      .getDocumentViewUrl(sellerId, document.documentId)
      .then((res) => {
        if (res.success && res.data?.viewUrl) {
          setViewUrl(res.data.viewUrl);
          setExpiresIn(res.data.expiresInSeconds);
        } else {
          setError('Unable to retrieve document preview URL.');
        }
      })
      .catch((err: any) => {
        setError(err?.message || 'Unable to load confidential document.');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, sellerId, document?.documentId]);

  if (!document) return null;

  const isPdf = document.mimeType?.includes('pdf');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.fileName}
      subtitle={`${document.documentType} · Confidential Seller Document`}
      size="lg"
      footer={
        <>
          {viewUrl && (
            <a href={viewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Open in New Tab
              </Button>
            </a>
          )}
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="h-72 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-500">
            Generating secure document link...
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : viewUrl ? (
          <div className="space-y-2">
            <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden min-h-[320px] flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={viewUrl}
                  title={document.fileName}
                  className="w-full h-[420px]"
                />
              ) : (
                <img
                  src={viewUrl}
                  alt={document.fileName}
                  className="max-h-[420px] object-contain mx-auto"
                />
              )}
            </div>
            {expiresIn && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Temporary viewing link expires in {Math.round(expiresIn / 60)} minutes.</span>
              </p>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
