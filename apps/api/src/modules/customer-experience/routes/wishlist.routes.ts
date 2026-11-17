import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
} from '../controllers/wishlist.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const wishlistRouter = Router();

// Customer authenticated wishlist
wishlistRouter.use(requireAuth);
wishlistRouter.use(requireRole('CUSTOMER'));

wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/items', addToWishlist);
wishlistRouter.delete('/items/:productId', removeFromWishlist);
wishlistRouter.post('/items/:productId/move-to-cart', moveWishlistItemToCart);
