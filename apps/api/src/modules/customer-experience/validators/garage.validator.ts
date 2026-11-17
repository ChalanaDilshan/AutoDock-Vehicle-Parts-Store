import { z } from 'zod';

export const AddGarageVehicleSchema = z.object({
  make: z.string({ required_error: 'Vehicle make is required' }).min(1).toUpperCase().trim(),
  model: z.string({ required_error: 'Vehicle model is required' }).min(1).toUpperCase().trim(),
  year: z.number({ required_error: 'Vehicle year is required' }).int().min(1960).max(2035),
  engine: z.string().toUpperCase().trim().optional().nullable(),
  vin: z
    .string()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN must be a valid 17-character alphanumeric string')
    .toUpperCase()
    .trim()
    .optional()
    .nullable(),
  nickname: z.string().max(50).trim().optional().nullable(),
  isDefault: z.boolean().default(false),
});
