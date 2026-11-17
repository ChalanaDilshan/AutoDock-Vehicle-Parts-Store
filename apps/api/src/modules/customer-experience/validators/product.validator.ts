import { z } from 'zod';

export const CreateProductSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  sku: z
    .string({ required_error: 'SKU is required' })
    .min(3, 'SKU must be at least 3 characters')
    .max(50, 'SKU cannot exceed 50 characters')
    .toUpperCase()
    .trim(),
  partNumber: z
    .string({ required_error: 'Part number is required' })
    .min(2, 'Part number must be at least 2 characters')
    .max(50, 'Part number cannot exceed 50 characters')
    .trim(),
  categoryId: z
    .string({ required_error: 'Category ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ObjectId format'),
  brandId: z
    .string({ required_error: 'Brand ID is required' })
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid brand ObjectId format'),
  condition: z.enum(['BRAND_NEW', 'RECONDITIONED', 'USED']).default('BRAND_NEW'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description cannot exceed 5000 characters')
    .trim(),
  priceInCents: z
    .number({ required_error: 'Price in cents is required' })
    .int('Price must be an integer minor unit (cents)')
    .min(100, 'Price must be at least Rs. 1.00 (100 cents)'),
  stock: z
    .number({ required_error: 'Stock is required' })
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  warrantyMonths: z.number().int().min(0).default(0),
  weightGrams: z.number().int().min(0).optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url('Image must be a valid URL'),
        isPrimary: z.boolean().default(false),
        altText: z.string().max(100).optional().nullable(),
      })
    )
    .min(1, 'At least one product image is required'),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1).max(50).trim(),
        value: z.string().min(1).max(100).trim(),
      })
    )
    .default([]),
  compatibleVehicles: z
    .array(
      z.object({
        make: z.string().min(1).toUpperCase().trim(),
        model: z.string().min(1).toUpperCase().trim(),
        yearFrom: z.number().int().min(1960).max(2035),
        yearTo: z.number().int().min(1960).max(2035),
        engineCode: z.string().toUpperCase().trim().optional().nullable(),
        trimOrChassis: z.string().toUpperCase().trim().optional().nullable(),
        compatibilityNotes: z.string().max(300).trim().optional().nullable(),
      })
    )
    .optional(),
});

export const UpdateProductSchema = z.object({
  title: z.string().min(5).max(200).trim().optional(),
  sku: z.string().min(3).max(50).toUpperCase().trim().optional(),
  partNumber: z.string().min(2).max(50).trim().optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  brandId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  condition: z.enum(['BRAND_NEW', 'RECONDITIONED', 'USED']).optional(),
  description: z.string().min(20).max(5000).trim().optional(),
  priceInCents: z.number().int().min(100).optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  warrantyMonths: z.number().int().min(0).optional(),
  weightGrams: z.number().int().min(0).optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        isPrimary: z.boolean(),
        altText: z.string().max(100).optional().nullable(),
      })
    )
    .min(1)
    .optional(),
  specifications: z
    .array(
      z.object({
        key: z.string().min(1).max(50).trim(),
        value: z.string().min(1).max(100).trim(),
      })
    )
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
});

export const AdjustStockSchema = z.object({
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const ProductStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']),
});

export const AddCompatibilitySchema = z.object({
  make: z.string({ required_error: 'Make is required' }).min(1).toUpperCase().trim(),
  model: z.string({ required_error: 'Model is required' }).min(1).toUpperCase().trim(),
  yearFrom: z.number().int().min(1960).max(2035),
  yearTo: z.number().int().min(1960).max(2035),
  engineCode: z.string().toUpperCase().trim().optional().nullable(),
  trimOrChassis: z.string().toUpperCase().trim().optional().nullable(),
  compatibilityNotes: z.string().max(300).trim().optional().nullable(),
});
