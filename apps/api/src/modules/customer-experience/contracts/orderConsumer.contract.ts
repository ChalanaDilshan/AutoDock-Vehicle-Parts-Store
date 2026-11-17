/**
 * Cross-module contract interface consumed by MOD-02 from MOD-03 Orders.
 * Verifies whether an authenticated customer has an authentic completed, delivered purchase of a product.
 */
export interface IOrderPublicContract {
  verifyDeliveredPurchase(
    userId: string,
    productId: string,
    suborderId: string
  ): Promise<{ isDelivered: boolean; deliveredAt?: Date; reason?: string }>;
}

class OrderVerificationServiceAdapter implements IOrderPublicContract {
  private customProvider: IOrderPublicContract | null = null;

  /**
   * Allows MOD-03 to register its live service provider implementation.
   */
  public registerProvider(provider: IOrderPublicContract): void {
    this.customProvider = provider;
  }

  public async verifyDeliveredPurchase(
    userId: string,
    productId: string,
    suborderId: string
  ): Promise<{ isDelivered: boolean; deliveredAt?: Date; reason?: string }> {
    if (this.customProvider) {
      return this.customProvider.verifyDeliveredPurchase(userId, productId, suborderId);
    }

    // Default fail-safe if MOD-03 is not yet connected:
    // Rejects non-verified claims safely to prevent review forgery
    return {
      isDelivered: false,
      reason: 'Order verification service is unavailable or suborder not found',
    };
  }
}

export const orderVerificationService = new OrderVerificationServiceAdapter();
