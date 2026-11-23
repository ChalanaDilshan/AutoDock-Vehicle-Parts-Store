import { Router } from 'express';

// Export Models
export {
  Order,
  IOrder,
  OrderOverallStatus,
  IOrderShippingAddress,
  IOrderStatusHistoryEntry,
} from './models/order.model.js';
export {
  Suborder,
  ISuborder,
  SuborderPaymentMethod,
  SuborderPaymentStatus,
  SuborderFulfillmentStatus,
  ISuborderItemSnapshot,
  IDeliveryRateSnapshot,
  ICourierDetails,
} from './models/suborder.model.js';
export {
  PaymentSlip,
  IPaymentSlip,
  PaymentSlipVerificationStatus,
} from './models/paymentSlip.model.js';
export {
  DeliveryRateProposal,
  IDeliveryRateProposal,
  DeliveryProposalStatus,
  IDistrictRateProposal,
} from './models/deliveryRateProposal.model.js';
export {
  DeliveryZoneRate,
  IDeliveryZoneRate,
  DeliveryZoneRateStatus,
} from './models/deliveryZone.model.js';
export {
  PaymentWebhookEvent,
  IPaymentWebhookEvent,
} from './models/paymentWebhookEvent.model.js';

// Export Routers
export { checkoutRouter } from './routes/checkout.routes.js';
export { orderRouter } from './routes/order.routes.js';
export { sellerOrderRouter } from './routes/sellerOrder.routes.js';
export {
  sellerDeliveryRateRouter,
  adminDeliveryRateRouter,
} from './routes/deliveryRate.routes.js';
export { adminOrderRouter } from './routes/adminOrder.routes.js';
export { paymentRouter } from './routes/payment.routes.js';

// Export Services
export { checkoutService, CheckoutService } from './services/checkout.service.js';
export { orderService, OrderService } from './services/order.service.js';
export { paymentService, PaymentService } from './services/payment.service.js';
export { deliveryRateService, DeliveryRateService } from './services/deliveryRate.service.js';
export { receiptStorageService, ReceiptStorageService } from './services/receiptStorage.service.js';
export { cardGatewayService, CardGatewayService } from './services/cardGateway.service.js';

// Export Contracts
export {
  orderPublicService,
  OrderPublicService,
  ISuborderDeliveredFinancialEvent,
} from './contracts/order.contract.js';

// Export Validators & Schemas
export {
  CheckoutQuoteSchema,
  PlaceOrderSchema,
  CheckoutQuoteInput,
  PlaceOrderInput,
  SRI_LANKA_DISTRICTS,
} from './validators/checkout.validator.js';
export {
  OrderQuerySchema,
  UpdateSuborderStatusSchema,
  CancelSuborderSchema,
  OrderQueryInput,
  UpdateSuborderStatusInput,
  CancelSuborderInput,
} from './validators/order.validator.js';
export {
  UploadPaymentReceiptSchema,
  VerifyReceiptSchema,
  InitiateCardPaymentSchema,
  CardWebhookSchema,
  UploadPaymentReceiptInput,
  VerifyReceiptInput,
  InitiateCardPaymentInput,
  CardWebhookInput,
} from './validators/payment.validator.js';
export {
  DeliveryRateProposalSchema,
  AdminProposalDecisionSchema,
  DeliveryRateProposalInput,
  AdminProposalDecisionInput,
} from './validators/deliveryRate.validator.js';

/**
 * MOD-03 Orders, Payments & Delivery Module Master Router
 */
export const ordersDeliveryRouter = Router();

ordersDeliveryRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-03 Orders, Payments & Delivery',
    status: 'READY',
  });
});
