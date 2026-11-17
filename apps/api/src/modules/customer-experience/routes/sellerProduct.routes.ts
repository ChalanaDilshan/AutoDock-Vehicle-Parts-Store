import { Router } from 'express';
import {
  createProduct,
  listSellerProducts,
  getSellerProduct,
  updateSellerProduct,
  adjustStock,
  updateStatus,
  deleteProduct,
} from '../controllers/sellerProduct.controller.js';
import { addProductCompatibility } from '../controllers/vehicle.controller.js';
import { getSellerReviews } from '../controllers/review.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const sellerProductRouter = Router();

// All seller product routes require SELLER role
sellerProductRouter.use(requireAuth);
sellerProductRouter.use(requireRole('SELLER'));

// Seller reviews view (read-only)
sellerProductRouter.get('/reviews', getSellerReviews);

// Product CRUD
sellerProductRouter.post('/', createProduct);
sellerProductRouter.get('/', listSellerProducts);
sellerProductRouter.get('/:id', getSellerProduct);
sellerProductRouter.put('/:id', updateSellerProduct);
sellerProductRouter.patch('/:id/stock', adjustStock);
sellerProductRouter.patch('/:id/status', updateStatus);
sellerProductRouter.delete('/:id', deleteProduct);

// Compatibility mapping for seller's product
sellerProductRouter.post('/:id/compatibility', addProductCompatibility);
