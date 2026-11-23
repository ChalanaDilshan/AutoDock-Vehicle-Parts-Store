import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service.js';
import {
  AddToCartSchema,
  UpdateCartItemQuantitySchema,
  MergeCartSchema,
} from '../validators/cart.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const cart = await cartService.getCart(userId);

    sendSuccess({
      res,
      code: 'CART_RETRIEVED',
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const parseResult = AddToCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid cart item payload',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const cart = await cartService.addToCart(
      userId,
      parseResult.data.productId,
      parseResult.data.quantity
    );

    sendSuccess({
      res,
      code: 'ITEM_ADDED_TO_CART',
      message: 'Item added to shopping cart successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateItemQuantity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;

    const parseResult = UpdateCartItemQuantitySchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid quantity',
      });
      return;
    }

    const cart = await cartService.updateItemQuantity(userId, itemId, parseResult.data.quantity);

    sendSuccess({
      res,
      code: 'CART_QUANTITY_UPDATED',
      message: 'Cart item quantity updated successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { itemId } = req.params;

    const cart = await cartService.removeItem(userId, itemId);

    sendSuccess({
      res,
      code: 'ITEM_REMOVED_FROM_CART',
      message: 'Item removed from cart successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
}

export async function mergeCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const parseResult = MergeCartSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid guest cart items array',
      });
      return;
    }

    const cart = await cartService.mergeGuestCart(userId, parseResult.data.guestItems);

    sendSuccess({
      res,
      code: 'CART_MERGED',
      message: 'Guest items merged into customer cart successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
}
