import { Router } from 'express';
import {
  searchProducts,
  getProductDetails,
  checkProductFitment,
} from '../controllers/publicProduct.controller.js';
import { getProductReviews } from '../controllers/review.controller.js';
import { getRecommendations } from '../controllers/recommendation.controller.js';

export const publicProductRouter = Router();

// Foundation compatibility health check
publicProductRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-02 Product & Customer Experience',
    status: 'READY',
  });
});

// Recommendation endpoint (must precede /:id)
publicProductRouter.get('/recommendations', getRecommendations);

// List & search products
publicProductRouter.get('/', searchProducts);

// Get single product details
publicProductRouter.get('/:id', getProductDetails);

// Real-time vehicle compatibility check
publicProductRouter.get('/:id/compatibility', checkProductFitment);

// Product reviews feed
publicProductRouter.get('/:id/reviews', getProductReviews);
