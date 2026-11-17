import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Cart } from '../models/cart.model.js';

export interface ProductStockReservationItemDTO {
  productId: string;
  quantity: number;
}

export interface ProductStockReservationResultDTO {
  isAvailable: boolean;
  reservedItems: Array<{
    productId: string;
    sellerId: string;
    title: string;
    sku: string;
    unitPriceInCents: number;
    quantity: number;
  }>;
  insufficientItems?: Array<{
    productId: string;
    requestedQuantity: number;
    availableStock: number;
  }>;
}

export interface ProductStockCommitItemDTO {
  productId: string;
  quantity: number;
}

export interface CartCheckoutHandoffDTO {
  userId: string;
  sellerGroups: Array<{
    sellerId: string;
    items: Array<{
      productId: string;
      title: string;
      sku: string;
      quantity: number;
      priceInCents: number;
      availableStock: number;
    }>;
    sellerSubtotalInCents: number;
  }>;
  cartGrandTotalInCents: number;
}

/**
 * Authoritative Public Service Interface for Cross-Module Integration.
 * External modules (such as MOD-03 Orders) consume this service to inspect stock, reserve,
 * decrement, or fetch prepared cart data without querying MOD-02 models directly.
 */
export class ProductModulePublicService {
  /**
   * Called by MOD-03 during Checkout to atomically verify live price & reserve physical stock.
   */
  public async verifyAndReserveStock(
    items: ProductStockReservationItemDTO[],
    _session?: mongoose.ClientSession
  ): Promise<ProductStockReservationResultDTO> {
    const reservedItems: ProductStockReservationResultDTO['reservedItems'] = [];
    const insufficientItems: NonNullable<ProductStockReservationResultDTO['insufficientItems']> = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'ACTIVE' || product.stock < item.quantity) {
        insufficientItems.push({
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableStock: product ? product.stock : 0,
        });
      } else {
        reservedItems.push({
          productId: product._id.toString(),
          sellerId: product.sellerId.toString(),
          title: product.title,
          sku: product.sku,
          unitPriceInCents: product.priceInCents,
          quantity: item.quantity,
        });
      }
    }

    if (insufficientItems.length > 0) {
      return {
        isAvailable: false,
        reservedItems: [],
        insufficientItems,
      };
    }

    return {
      isAvailable: true,
      reservedItems,
    };
  }

  /**
   * Called by MOD-03 upon confirmed Order placement to permanently decrement inventory.
   */
  public async decrementStock(
    items: ProductStockCommitItemDTO[],
    session?: mongoose.ClientSession
  ): Promise<boolean> {
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.productId, stock: { $gte: item.quantity } },
        {
          $inc: { stock: -item.quantity },
          $set: { updatedAt: new Date() },
        },
        { session }
      );

      if (result.matchedCount === 0) {
        return false;
      }

      // If stock drops to 0, mark OUT_OF_STOCK
      await Product.updateOne(
        { _id: item.productId, stock: 0, status: 'ACTIVE' },
        { $set: { status: 'OUT_OF_STOCK' } },
        { session }
      );
    }

    return true;
  }

  /**
   * Called by MOD-03 if order placement fails or is cancelled to release reserved stock.
   */
  public async releaseStock(
    items: ProductStockCommitItemDTO[],
    session?: mongoose.ClientSession
  ): Promise<boolean> {
    for (const item of items) {
      await Product.updateOne(
        { _id: item.productId },
        {
          $inc: { stock: item.quantity },
          $set: { updatedAt: new Date() },
        },
        { session }
      );

      // If product was OUT_OF_STOCK and now has inventory, restore ACTIVE
      await Product.updateOne(
        { _id: item.productId, stock: { $gt: 0 }, status: 'OUT_OF_STOCK' },
        { $set: { status: 'ACTIVE' } },
        { session }
      );
    }

    return true;
  }

  /**
   * Called by MOD-03 to extract the customer's active cart structured by seller suborders.
   */
  public async getCartForCheckout(
    userId: string
  ): Promise<CartCheckoutHandoffDTO | null> {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return null;
    }

    const sellerMap = new Map<
      string,
      Array<{
        productId: string;
        title: string;
        sku: string;
        quantity: number;
        priceInCents: number;
        availableStock: number;
      }>
    >();

    let cartGrandTotalInCents = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'ACTIVE') {
        continue;
      }

      const sellerIdStr = product.sellerId.toString();
      const currentList = sellerMap.get(sellerIdStr) || [];

      currentList.push({
        productId: product._id.toString(),
        title: product.title,
        sku: product.sku,
        quantity: item.quantity,
        priceInCents: product.priceInCents,
        availableStock: product.stock,
      });

      sellerMap.set(sellerIdStr, currentList);
      cartGrandTotalInCents += product.priceInCents * item.quantity;
    }

    const sellerGroups = Array.from(sellerMap.entries()).map(([sellerId, items]) => {
      const sellerSubtotalInCents = items.reduce(
        (sum, it) => sum + it.priceInCents * it.quantity,
        0
      );
      return {
        sellerId,
        items,
        sellerSubtotalInCents,
      };
    });

    return {
      userId,
      sellerGroups,
      cartGrandTotalInCents,
    };
  }

  /**
   * Called by MOD-03 after successful order creation to empty the customer's cart.
   */
  public async clearCart(
    userId: string,
    session?: mongoose.ClientSession
  ): Promise<boolean> {
    await Cart.updateOne({ userId }, { $set: { items: [] } }, { session });
    return true;
  }
}

export const productPublicService = new ProductModulePublicService();
