import { Router } from 'express';
import {
  getCategoryTree,
  adminCreateCategory,
  adminUpdateCategory,
} from '../controllers/category.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const categoryRouter = Router();

// Public: Get category tree
categoryRouter.get('/', getCategoryTree);

// Admin: Create & Update categories
categoryRouter.post('/', requireAuth, requireRole('ADMIN'), adminCreateCategory);
categoryRouter.put('/:id', requireAuth, requireRole('ADMIN'), adminUpdateCategory);
