import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateItemQuantity,
  removeItem,
  mergeCart,
} from '../controllers/cart.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const cartRouter = Router();

// Customer authenticated cart
cartRouter.use(requireAuth);
cartRouter.use(requireRole('CUSTOMER'));

cartRouter.get('/', getCart);
cartRouter.post('/items', addToCart);
cartRouter.put('/items/:itemId', updateItemQuantity);
cartRouter.delete('/items/:itemId', removeItem);
cartRouter.post('/merge', mergeCart);
