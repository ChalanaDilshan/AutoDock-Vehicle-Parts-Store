import React, { useState, useRef } from 'react';
import { DocumentType, SellerDocumentItem } from '../api/identityApi.js';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentDropzoneProps {
  label: string;
  description: string;
  documentType: DocumentType;
  required?: boolean;
  currentDocument?: SellerDocumentItem | null;
  onUpload: (payload: {
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    fileContentBase64: string;
  }) => Promise<void>;
  disabled?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  label,
  description,
  documentType,
  required = true,
  currentDocument,
  onUpload,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a PDF, JPEG, or PNG document.');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 10MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 payload after data URL prefix
          const base64Data = result.split(',')[1] || result;
          resolve(base64Data);
        };
        reader.onerror = () => reject(new Error('Failed to read file.'));
      });

      reader.readAsDataURL(file);
      const fileContentBase64 = await base64Promise;

      await onUpload({
        documentType,
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        fileContentBase64,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Uploaded (Pending Review)
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 transition-all hover:border-slate-300">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
            {label}
            {required && <span className="text-red-500 font-bold">*</span>}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {currentDocument && getStatusBadge(currentDocument.reviewStatus)}
      </div>

      {currentDocument ? (
        <div className="mt-3 p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 truncate">
            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium truncate">{currentDocument.fileName}</span>
            <span className="text-slate-400">
              ({(currentDocument.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 font-medium underline shrink-0"
              disabled={isUploading}
            >
              Replace
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`mt-2 border-2 border-dashed border-slate-300 rounded-lg p-5 text-center transition cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 ${
            disabled ? 'opacity-60 cursor-not-allowed hover:border-slate-300 hover:bg-transparent' : ''
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 text-blue-600">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs font-medium">Encrypting and uploading document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
              <p className="text-xs font-medium text-slate-700">
                Click to browse or drag file here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, JPEG, or PNG up to 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        aria-label={`Upload ${label}`}
      />

      {errorMessage && (
        <div className="mt-2 text-xs text-red-600 flex items-center gap-1.5 bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
