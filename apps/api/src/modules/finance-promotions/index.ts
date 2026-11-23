import { Router } from 'express';
import { financePublicRouter } from './routes/financePublic.routes.js';

export { sellerFinanceRouter } from './routes/sellerFinance.routes.js';
export { sellerPromotionRouter } from './routes/sellerPromotion.routes.js';
export { adminFinanceRouter } from './routes/adminFinance.routes.js';
export { adminPromotionRouter } from './routes/adminPromotion.routes.js';
export { financePublicRouter } from './routes/financePublic.routes.js';

// Export Models
export * from './models/commissionRate.model.js';
export * from './models/commissionExemption.model.js';
export * from './models/commissionLedger.model.js';
export * from './models/sellerInvoice.model.js';
export * from './models/invoicePaymentReceipt.model.js';
export * from './models/promotion.model.js';
export * from './models/promotionRedemption.model.js';
export * from './models/platformSubsidyLedger.model.js';
export * from './models/platformFinancialSettings.model.js';

// Export Services
export * from './services/commission.service.js';
export * from './services/invoice.service.js';
export * from './services/paymentVerification.service.js';
export * from './services/promotion.service.js';
export * from './services/subsidy.service.js';
export * from './services/platformFinancialSettings.service.js';

// Export Cross-Module Contracts
export * from './contracts/promotion.contract.js';
export * from './contracts/finance.contract.js';

/**
 * MOD-04 Finance & Promotion Management Root Router
 */
export const financePromotionsRouter = Router();

financePromotionsRouter.use('/public', financePublicRouter);
financePromotionsRouter.use('/', financePublicRouter);
