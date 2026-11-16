import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { storageService } from './services/storage.service.js';

// Export routers
export { authRouter } from './routes/auth.routes.js';
export { userRouter } from './routes/user.routes.js';
export { sellerRouter } from './routes/seller.routes.js';
export { adminSellerRouter } from './routes/adminSeller.routes.js';

// Export models
export { User, IUser, UserRole, UserAccountStatus } from './models/user.model.js';
export {
  SellerProfile,
  ISellerProfile,
  SellerStoreType,
  SellerVerificationStatus,
} from './models/sellerProfile.model.js';
export {
  SellerDocument,
  ISellerDocument,
  DocumentType,
  DocumentReviewStatus,
} from './models/sellerDocument.model.js';
export {
  SellerBankDetails,
  ISellerBankDetails,
  BankVerificationStatus,
} from './models/sellerBankDetails.model.js';
export {
  PrivacyAcknowledgement,
  IPrivacyAcknowledgement,
} from './models/privacyAcknowledgement.model.js';

// Export public contracts and services
export {
  identityPublicService,
  IdentityModulePublicService,
  SellerSellingEligibilityDTO,
  SellerPublicProfileDTO,
  VerifiedSellerBankDetailsDTO,
  SellerBillingIdentityDTO,
} from './contracts/identity.contract.js';

// Export middleware
export { requireAuth, requireRole, AuthenticatedUserPayload } from './middleware/auth.middleware.js';

/**
 * MOD-01 Identity Module Router
 */
export const identityRouter = Router();

// Foundation compatibility health check
identityRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    module: 'MOD-01 Identity & Seller Verification',
    status: 'READY',
  });
});

/**
 * Secure token-gated document stream endpoint for presigned viewing links
 */
identityRouter.get('/documents/stream', async (req: Request, res: Response) => {
  try {
    const { key, expires, token } = req.query;

    if (!key || !expires || !token) {
      res.status(400).json({ success: false, message: 'Invalid document access link parameters' });
      return;
    }

    const expiresNum = parseInt(expires as string, 10);
    const now = Math.floor(Date.now() / 1000);

    if (now > expiresNum) {
      res.status(403).json({ success: false, message: 'Document access link has expired' });
      return;
    }

    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET);
    hmac.update(`${key}:${expires}`);
    const expectedToken = hmac.digest('hex');

    if (token !== expectedToken) {
      res.status(403).json({ success: false, message: 'Invalid or forged document access signature' });
      return;
    }

    const { buffer, mimeType } = await storageService.getFileBuffer(key as string);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(buffer);
  } catch (_err) {
    res.status(404).json({ success: false, message: 'Private document not found' });
  }
});
