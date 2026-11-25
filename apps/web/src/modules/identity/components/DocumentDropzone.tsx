import React, { useState, useId } from 'react';
import { Upload, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { DocumentType, SellerDocumentItem } from '../api/identityApi.js';
import { Alert, Badge } from '../../../shared/components/index.js';

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
    if (!file) return;
    setErrorMessage(null);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File exceeds 5MB size limit.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const result = reader.result as string;
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          await onUpload({
            documentType,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
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
          accept=".pdf,.jpg,.jpeg,.png"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          aria-label={label}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer ${
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
        <span className="text-xs text-slate-400">PDF, JPG or PNG (max 5MB)</span>
      </div>
    </div>
  );
};
