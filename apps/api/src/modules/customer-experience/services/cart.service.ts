import mongoose from 'mongoose';
import { Cart, ICartItem } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { identityPublicService } from '../../identity/index.js';

export class CartService {
  public async getCart(userId: string) {
    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      cart = await Cart.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    // Populate live product information
    const sellerMap = new Map<
      string,
      {
        sellerId: string;
        sellerBusinessName: string;
        items: Array<{
          id: string;
          productId: string;
          title: string;
          sku: string;
          primaryImageUrl?: string;
          unitPriceInCents: number;
          priceInCentsAtAdd: number;
          quantity: number;
          lineTotalInCents: number;
          availableStock: number;
          isOutOfStock: boolean;
        }>;
        sellerSubtotalInCents: number;
      }
    >();

    let totalItems = 0;
    let grandTotalInCents = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      const sellerIdStr = product.sellerId.toString();
      let sellerGroup = sellerMap.get(sellerIdStr);

      if (!sellerGroup) {
        const sellerProfile = await identityPublicService.getSellerPublicProfile(sellerIdStr);
        sellerGroup = {
          sellerId: sellerIdStr,
          sellerBusinessName: sellerProfile?.businessName || 'Spare Parts Merchant',
          items: [],
          sellerSubtotalInCents: 0,
        };
        sellerMap.set(sellerIdStr, sellerGroup);
      }

      const primaryImage =
        product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

      const lineTotal = product.priceInCents * item.quantity;
      const isOutOfStock = product.status !== 'ACTIVE' || product.stock < item.quantity;

      sellerGroup.items.push({
        id: item._id.toString(),
        productId: product._id.toString(),
        title: product.title,
        sku: product.sku,
        primaryImageUrl: primaryImage,
        unitPriceInCents: product.priceInCents,
        priceInCentsAtAdd: item.priceInCentsAtAdd,
        quantity: item.quantity,
        lineTotalInCents: lineTotal,
        availableStock: product.stock,
        isOutOfStock,
      });

      sellerGroup.sellerSubtotalInCents += lineTotal;
      totalItems += item.quantity;
      grandTotalInCents += lineTotal;
    }

    return {
      cartId: cart._id.toString(),
      totalItems,
      grandTotalInCents,
      sellerGroups: Array.from(sellerMap.values()),
    };
  }

  public async addToCart(userId: string, productId: string, quantity: number = 1) {
    const product = await Product.findById(productId);
    if (!product || product.status !== 'ACTIVE') {
      const err = new Error('Product is unavailable or does not exist');
      (err as any).statusCode = 400;
      (err as any).code = 'PRODUCT_UNAVAILABLE';
      throw err;
    }

    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      cart = await Cart.create({
        userId: new mongoose.Types.ObjectId(userId),
        items: [],
      });
    }

    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingIndex > -1) {
      const existing = cart.items[existingIndex];
      const newQuantity = existing.quantity + quantity;

      if (newQuantity > product.stock) {
        const err = new Error(
          `Cannot add quantity. Only ${product.stock} units available in stock.`
        );
        (err as any).statusCode = 400;
        (err as any).code = 'INSUFFICIENT_STOCK';
        throw err;
      }

      existing.quantity = newQuantity;
    } else {
      if (quantity > product.stock) {
        const err = new Error(
          `Requested quantity exceeds available stock (${product.stock} available).`
        );
        (err as any).statusCode = 400;
        (err as any).code = 'INSUFFICIENT_STOCK';
        throw err;
      }

      cart.items.push({
        _id: new mongoose.Types.ObjectId(),
        productId: product._id,
        sellerId: product.sellerId,
        quantity,
        priceInCentsAtAdd: product.priceInCents,
      } as ICartItem);
    }

    await cart.save();
    return this.getCart(userId);
  }

  public async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      const err = new Error('Cart not found');
      (err as any).statusCode = 404;
      (err as any).code = 'CART_NOT_FOUND';
      throw err;
    }

    const item = cart.items.find((i) => i._id.toString() === itemId);
    if (!item) {
      const err = new Error('Cart item not found');
      (err as any).statusCode = 404;
      (err as any).code = 'CART_ITEM_NOT_FOUND';
      throw err;
    }

    const product = await Product.findById(item.productId);
    if (!product || product.status !== 'ACTIVE') {
      const err = new Error('Product is no longer available');
      (err as any).statusCode = 400;
      (err as any).code = 'PRODUCT_UNAVAILABLE';
      throw err;
    }

    if (quantity > product.stock) {
      const err = new Error(
        `Requested quantity exceeds available stock (${product.stock} available).`
      );
      (err as any).statusCode = 400;
      (err as any).code = 'INSUFFICIENT_STOCK';
      throw err;
    }

    item.quantity = quantity;
    await cart.save();

    return this.getCart(userId);
  }

  public async removeItem(userId: string, itemId: string) {
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!cart) {
      return null;
    }

    const itemIndex = cart.items.findIndex((i) => i._id.toString() === itemId);
    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
    }

    return this.getCart(userId);
  }

  public async mergeGuestCart(
    userId: string,
    guestItems: Array<{ productId: string; quantity: number }>
  ) {
    for (const gItem of guestItems) {
      try {
        await this.addToCart(userId, gItem.productId, gItem.quantity);
      } catch (_err) {
        // Skip items that cannot be added (e.g. out of stock) during merge
      }
    }

    return this.getCart(userId);
  }
}

export const cartService = new CartService();
