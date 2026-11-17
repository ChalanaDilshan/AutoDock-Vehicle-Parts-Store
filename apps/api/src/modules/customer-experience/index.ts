import { Router } from 'express';

// Export models
export { Category, ICategory } from './models/category.model.js';
export { Brand, IBrand } from './models/brand.model.js';
export {
  Product,
  IProduct,
  ProductStatus,
  ProductCondition,
  IProductImage,
  IProductSpecification,
} from './models/product.model.js';
export {
  VehicleCompatibility,
  IVehicleCompatibility,
} from './models/vehicleCompatibility.model.js';
export {
  CustomerGarage,
  ICustomerGarage,
  IGarageVehicle,
} from './models/customerGarage.model.js';
export { Cart, ICart, ICartItem } from './models/cart.model.js';
export { Wishlist, IWishlist, IWishlistItem } from './models/wishlist.model.js';
export { Review, IReview, ReviewStatus } from './models/review.model.js';

// Export routers
export { publicProductRouter } from './routes/publicProduct.routes.js';
export { sellerProductRouter } from './routes/sellerProduct.routes.js';
export { categoryRouter } from './routes/category.routes.js';
export { brandRouter } from './routes/brand.routes.js';
export { vehicleRouter } from './routes/vehicle.routes.js';
export { garageRouter } from './routes/garage.routes.js';
export { cartRouter } from './routes/cart.routes.js';
export { wishlistRouter } from './routes/wishlist.routes.js';
export { reviewRouter } from './routes/review.routes.js';
export { adminProductRouter } from './routes/adminProduct.routes.js';
export { adminReviewRouter } from './routes/adminReview.routes.js';

// Export contracts & services
export {
  productPublicService,
  ProductModulePublicService,
  ProductStockReservationItemDTO,
  ProductStockReservationResultDTO,
  ProductStockCommitItemDTO,
  CartCheckoutHandoffDTO,
} from './contracts/product.contract.js';

export {
  orderVerificationService,
  IOrderPublicContract,
} from './contracts/orderConsumer.contract.js';

export { productService } from './services/product.service.js';
export { categoryService } from './services/category.service.js';
export { brandService } from './services/brand.service.js';
export { vehicleService } from './services/vehicle.service.js';
export { customerGarageService } from './services/garage.service.js';
export { cartService } from './services/cart.service.js';
export { wishlistService } from './services/wishlist.service.js';
export { reviewService } from './services/review.service.js';
export { recommendationService } from './services/recommendation.service.js';

/**
 * MOD-02 Product & Customer Experience Module Legacy Router
 */
export const customerExperienceRouter = Router();

customerExperienceRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-02 Product & Customer Experience',
    status: 'READY',
  });
});
