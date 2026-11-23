import { Router } from 'express';
import {
  getAllBrands,
  adminCreateBrand,
  adminUpdateBrand,
} from '../controllers/brand.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const brandRouter = Router();

// Public: Get all active brands
brandRouter.get('/', getAllBrands);

// Admin: Create & Update brands
brandRouter.post('/', requireAuth, requireRole('ADMIN'), adminCreateBrand);
brandRouter.put('/:id', requireAuth, requireRole('ADMIN'), adminUpdateBrand);
