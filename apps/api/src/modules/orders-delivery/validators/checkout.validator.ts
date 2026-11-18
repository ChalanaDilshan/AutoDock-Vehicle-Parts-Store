import { z } from 'zod';

export const SRI_LANKA_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
] as const;

export const CheckoutQuoteSchema = z.object({
  shippingDistrict: z
    .string({ required_error: 'shippingDistrict is required' })
    .trim()
    .min(2, 'District name is too short')
    .max(50, 'District name is too long'),
  promoCode: z.string().trim().max(30).optional(),
});

export const PlaceOrderSchema = z.object({
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER', 'CARD_SANDBOX'], {
    required_error: 'paymentMethod must be one of COD, BANK_TRANSFER, or CARD_SANDBOX',
  }),
  promoCode: z.string().trim().max(30).optional(),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^\+94\d{9}$/, 'Phone number must be a valid Sri Lankan mobile format (+947XXXXXXXX)'),
    street: z.string().trim().min(3, 'Street address must be at least 3 characters').max(150),
    city: z.string().trim().min(2, 'City must be at least 2 characters').max(100),
    district: z.string().trim().min(2).max(50),
    postalCode: z.string().trim().regex(/^\d{5}$/, 'Postal code must be exactly 5 digits'),
  }),
  suborderOverrides: z
    .array(
      z.object({
        sellerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid sellerId format'),
        paymentMethod: z.enum(['COD', 'BANK_TRANSFER', 'CARD_SANDBOX']),
      })
    )
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutQuoteInput = z.infer<typeof CheckoutQuoteSchema>;
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;
