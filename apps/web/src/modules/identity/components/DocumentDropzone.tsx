import React, { useState, useId } from 'react';
import { Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DocumentType, SellerDocumentItem } from '../api/identityApi.js';
import { Alert, Badge } from '../../../shared/components/index.js';

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024; // 10 MB (aligned with UploadDocumentSchema)
const MIN_DOCUMENT_BYTES = 100;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

function resolveAllowedMimeType(file: File): string | null {
  const normalizedType = (file.type || '').toLowerCase();
  if (normalizedType) {
    return ALLOWED_MIME_TYPES.has(normalizedType) ? normalizedType : null;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  return null;
}

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
    fileContentBase64?: string;
  }) => Promise<void>;
  disabled?: boolean;
}

export const DocumentDropzone: React.FC<DocumentDropzoneProps> = ({
  label,
  description,
  documentType,
  required = true,
  currentDocument,
  onUpload,
  disabled = false,
}) => {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMessage(null);

    const resolvedMime = resolveAllowedMimeType(file);
    if (!resolvedMime) {
      setErrorMessage('Unsupported file type. Upload a PDF, JPG, or PNG file.');
      return;
    }

    if (file.size < MIN_DOCUMENT_BYTES) {
      setErrorMessage('File is too small (minimum 100 bytes required).');
      return;
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setErrorMessage('File exceeds 10MB size limit.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onerror = () => {
        setErrorMessage('Unable to read selected file.');
        setIsUploading(false);
      };
      reader.onload = async () => {
        try {
          const result = typeof reader.result === 'string' ? reader.result : '';
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          if (!base64 || base64.trim().length === 0) {
            setErrorMessage('Selected file could not be encoded or is empty.');
            return;
          }
          await onUpload({
            documentType,
            fileName: file.name,
            mimeType: resolvedMime,
            fileSizeBytes: file.size,
            fileContentBase64: base64,
          });
        } catch (err: any) {
          setErrorMessage(err?.message || 'Upload failed.');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to read selected file.');
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-slate-900"
          >
            {label}
            {required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        {currentDocument && (
          <Badge
            variant={
              currentDocument.reviewStatus === 'ACCEPTED'
                ? 'success'
                : currentDocument.reviewStatus === 'REJECTED'
                  ? 'danger'
                  : 'warning'
            }
          >
            {currentDocument.reviewStatus === 'ACCEPTED' && (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {currentDocument.reviewStatus === 'REJECTED' && (
              <XCircle className="w-3 h-3" />
            )}
            {currentDocument.reviewStatus === 'PENDING' && (
              <Clock className="w-3 h-3" />
            )}
            <span>{currentDocument.reviewStatus}</span>
          </Badge>
        )}
      </div>

      {currentDocument && (
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2 flex items-center justify-between gap-2">
          <span className="truncate font-medium">{currentDocument.fileName}</span>
          <span className="text-slate-400 shrink-0">
            {Math.round(currentDocument.fileSizeBytes / 1024)} KB
          </span>
        </div>
      )}

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="flex items-center gap-3">
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          aria-label={label}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer ${
            disabled || isUploading ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>
            {isUploading
              ? 'Uploading...'
              : currentDocument
                ? 'Replace Document'
                : 'Choose File'}
          </span>
        </label>
        <span className="text-xs text-slate-500">PDF, JPG or PNG (max 10MB)</span>
      </div>
    </div>
  );
};
