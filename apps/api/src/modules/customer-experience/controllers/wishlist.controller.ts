import { Request, Response, NextFunction } from 'express';
import { wishlistService } from '../services/wishlist.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const wishlist = await wishlistService.getWishlist(userId);

    sendSuccess({
      res,
      code: 'WISHLIST_RETRIEVED',
      message: 'Wishlist retrieved successfully',
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;

    if (!productId || !/^[0-9a-fA-F]{24}$/.test(productId)) {
      sendError({
        res,
        statusCode: 400,
        code: 'INVALID_PRODUCT_ID',
        message: 'A valid product ID is required to add to wishlist',
      });
      return;
    }

    const wishlist = await wishlistService.addToWishlist(userId, productId);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'ITEM_ADDED_TO_WISHLIST',
      message: 'Product added to wishlist successfully',
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const wishlist = await wishlistService.removeFromWishlist(userId, productId);

    sendSuccess({
      res,
      code: 'ITEM_REMOVED_FROM_WISHLIST',
      message: 'Product removed from wishlist successfully',
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
}

export async function moveWishlistItemToCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { productId } = req.params;

    const result = await wishlistService.moveToCart(userId, productId);

    sendSuccess({
      res,
      code: 'MOVED_TO_CART',
      message: result.message,
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
