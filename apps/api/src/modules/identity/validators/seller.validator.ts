import { z } from 'zod';

export const CreateSellerProfileSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters').max(100).trim(),
  storeSlug: z
    .string()
    .min(3, 'Store slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Store slug may only contain lowercase letters, numbers, and hyphens'),
  sellerType: z.enum(['PHYSICAL_STORE', 'ONLINE_ONLY'], {
    errorMap: () => ({ message: 'Seller type must be PHYSICAL_STORE or ONLINE_ONLY' }),
  }),
  businessRegistrationNumber: z
    .string()
    .min(3, 'Business registration number is required')
    .max(50)
    .trim(),
  operatingAddress: z.object({
    street: z.string().min(3, 'Street address is required').max(150),
    city: z.string().min(2, 'City is required').max(100),
    district: z.string().min(2, 'District is required').max(50),
    province: z.string().min(2, 'Province is required').max(50),
    postalCode: z.string().regex(/^\d{5}$/, 'Postal code must be a 5-digit number'),
  }),
  contactPhone: z
    .string()
    .regex(/^\+94\d{9}$/, 'Contact phone must follow Sri Lankan E.164 format: +94XXXXXXXXX'),
});

export const UploadDocumentSchema = z.object({
  documentType: z.enum(
    ['BUSINESS_REGISTRATION', 'SELLER_ID_CARD', 'SELLER_FACE_PHOTO', 'STORE_PHOTO'],
    {
      errorMap: () => ({
        message:
          'Document type must be BUSINESS_REGISTRATION, SELLER_ID_CARD, SELLER_FACE_PHOTO, or STORE_PHOTO',
      }),
    }
  ),
  fileName: z.string().min(1, 'File name is required').max(255),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png'], {
    errorMap: () => ({
      message: 'MIME type must be application/pdf, image/jpeg, or image/png',
    }),
  }),
  fileSizeBytes: z
    .number()
    .int()
    .min(100, 'File size too small')
    .max(10485760, 'File size cannot exceed 10 MB'),
  fileContentBase64: z.string().optional(),
});

export const SubmitBankDetailsSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required').max(100).trim(),
  accountHolderName: z.string().min(3, 'Account holder name is required').max(100).trim(),
  accountNumber: z
    .string()
    .min(6, 'Account number must be at least 6 characters')
    .max(30)
    .regex(/^[0-9A-Za-z-]+$/, 'Account number may only contain letters, numbers, and dashes'),
  branchName: z.string().min(2, 'Branch name is required').max(100).trim(),
  branchCode: z.string().max(10).optional(),
});

export const AcknowledgePrivacySchema = z.object({
  noticeVersion: z.string().min(1, 'Notice version is required').max(20),
  acknowledged: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly accept the privacy notice' }),
  }),
});

export const ReviewSellerSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_INFO'], {
    errorMap: () => ({ message: 'Decision must be APPROVE, REJECT, or REQUEST_INFO' }),
  }),
  verificationMethod: z
    .enum(['PHYSICAL_VISIT', 'WHATSAPP_VIDEO_CALL', 'DOCUMENT_ONLY'])
    .optional(),
  verificationNotes: z
    .string()
    .min(5, 'Verification notes must be at least 5 characters')
    .max(1000)
    .trim(),
});

export const VerifyBankDetailsSchema = z.object({
  decision: z.enum(['VERIFY', 'REJECT'], {
    errorMap: () => ({ message: 'Decision must be VERIFY or REJECT' }),
  }),
  rejectionReason: z.string().max(500).optional(),
});

export type CreateSellerProfileInput = z.infer<typeof CreateSellerProfileSchema>;
export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type SubmitBankDetailsInput = z.infer<typeof SubmitBankDetailsSchema>;
export type AcknowledgePrivacyInput = z.infer<typeof AcknowledgePrivacySchema>;
export type ReviewSellerInput = z.infer<typeof ReviewSellerSchema>;
export type VerifyBankDetailsInput = z.infer<typeof VerifyBankDetailsSchema>;
