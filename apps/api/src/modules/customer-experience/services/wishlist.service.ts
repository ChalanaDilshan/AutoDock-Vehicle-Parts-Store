import mongoose from 'mongoose';
import { Wishlist, IWishlistItem } from '../models/wishlist.model.js';
import { Product } from '../models/product.model.js';
import { cartService } from './cart.service.js';

export class WishlistService {
  public async getWishlist(userId: string) {
    let wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    const populatedItems = [];

    for (const item of wishlist.items) {
      const product = await Product.findById(item.productId)
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .lean();

      if (product) {
        const primaryImage =
          product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

        populatedItems.push({
          productId: product._id.toString(),
          title: product.title,
          sku: product.sku,
          priceInCents: product.priceInCents,
          stock: product.stock,
          isOutOfStock: product.status !== 'ACTIVE' || product.stock === 0,
          primaryImageUrl: primaryImage,
          category: product.categoryId,
          brand: product.brandId,
          addedAt: item.addedAt,
        });
      }
    }

    return {
      wishlistId: wishlist._id.toString(),
      totalItems: populatedItems.length,
      items: populatedItems,
    };
  }

  public async addToWishlist(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Product not found');
      (err as any).statusCode = 404;
      (err as any).code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    let wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    const alreadySaved = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    if (!alreadySaved) {
      wishlist.items.push({
        _id: new mongoose.Types.ObjectId(),
        productId: product._id,
        addedAt: new Date(),
      } as IWishlistItem);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  public async removeFromWishlist(userId: string, productId: string) {
    const wishlist = await Wishlist.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!wishlist) {
      return null;
    }

    const itemIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      wishlist.items.splice(itemIndex, 1);
      await wishlist.save();
    }

    return this.getWishlist(userId);
  }

  public async moveToCart(userId: string, productId: string) {
    // 1. Add to cart with live stock check
    await cartService.addToCart(userId, productId, 1);

    // 2. Remove from wishlist
    await this.removeFromWishlist(userId, productId);

    return {
      success: true,
      message: 'Item moved from wishlist to cart successfully',
    };
  }
}

export const wishlistService = new WishlistService();
