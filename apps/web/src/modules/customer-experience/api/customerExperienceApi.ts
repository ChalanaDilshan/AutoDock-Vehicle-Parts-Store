import { apiClient } from '../../../shared/api/apiClient.js';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type ProductCondition = 'NEW' | 'USED' | 'RECONDITIONED';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type FitmentStatus = 'EXACT_FIT' | 'DOES_NOT_FIT' | 'UNIVERSAL_FIT' | 'UNCERTAIN';
export type ReviewModerationStatus = 'PUBLISHED' | 'HIDDEN_BY_ADMIN' | 'REMOVED_BY_ADMIN';

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  displayOrder: number;
  children?: CategoryItem[];
}

export interface BrandItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  countryOfOrigin?: string;
  isActive: boolean;
}

export interface ProductItem {
  _id: string;
  sellerId: string;
  storeName?: string;
  name: string;
  slug: string;
  sku: string;
  partNumber?: string;
  oemNumber?: string;
  categoryId: string | CategoryItem;
  brandId: string | BrandItem;
  description: string;
  priceInCents: number;
  stock: number;
  lowStockThreshold?: number;
  condition: ProductCondition;
  warrantyMonths?: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
    altText?: string;
  }>;
  specifications: Record<string, string>;
  status: ProductStatus;
  averageRating: number;
  reviewCount: number;
  isUniversalFit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchQuery {
  q?: string;
  category?: string;
  brand?: string;
  condition?: ProductCondition;
  minPrice?: number;
  maxPrice?: number;
  make?: string;
  model?: string;
  year?: number;
  submodel?: string;
  sortBy?: 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'RATING_DESC';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  status: FitmentStatus;
  fitmentType: string;
  notes?: string;
  vehicle: {
    make: string;
    model: string;
    year?: number;
    submodel?: string;
  };
}

export interface GarageVehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  submodel?: string;
  engine?: string;
  vin?: string;
  nickname?: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface CartItem {
  _id: string;
  productId: ProductItem;
  sellerId: string;
  quantity: number;
  priceInCentsAtAdd: number;
  addedAt: string;
}

export interface CartSellerGroup {
  sellerId: string;
  storeName?: string;
  items: CartItem[];
  subtotalInCents: number;
}

export interface CartData {
  _id: string;
  userId: string;
  items: CartItem[];
  sellerGroups?: CartSellerGroup[];
  totalInCents: number;
}

export interface WishlistItem {
  productId: ProductItem;
  addedAt: string;
}

export interface WishlistData {
  _id: string;
  userId: string;
  items: WishlistItem[];
}

export interface ProductReview {
  _id: string;
  productId: string | { _id: string; name: string; sku: string };
  userId: string | { _id: string; firstName: string; lastName: string };
  sellerId: string;
  suborderId: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  moderationStatus: ReviewModerationStatus;
  moderationReason?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

// ---------------------------------------------------------------------------
// Products API (Public)
// ---------------------------------------------------------------------------

export const productsApi = {
  search: (query: ProductSearchQuery = {}): Promise<ApiResponse<PaginatedResult<ProductItem>>> => {
    return apiClient.get('/products', { params: query });
  },

  getById: (id: string): Promise<ApiResponse<ProductItem>> => {
    return apiClient.get(`/products/${id}`);
  },

  checkFitment: (
    id: string,
    params: { make: string; model: string; year?: number; submodel?: string }
  ): Promise<ApiResponse<CompatibilityCheckResult>> => {
    return apiClient.get(`/products/${id}/compatibility`, { params });
  },

  getReviews: (id: string, params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResult<ProductReview>>> => {
    return apiClient.get(`/products/${id}/reviews`, { params });
  },

  getRecommendations: (params: {
    productId?: string;
    category?: string;
    make?: string;
    model?: string;
    year?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<ProductItem[]>> => {
    return apiClient.get('/products/recommendations', { params });
  },
};

// ---------------------------------------------------------------------------
// Seller Products API (Authenticated Seller)
// ---------------------------------------------------------------------------

export const sellerProductsApi = {
  list: (params: { page?: number; limit?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<ProductItem>>> => {
    return apiClient.get('/seller/products', { params });
  },

  getById: (id: string): Promise<ApiResponse<ProductItem>> => {
    return apiClient.get(`/seller/products/${id}`);
  },

  create: (data: Partial<ProductItem>): Promise<ApiResponse<ProductItem>> => {
    return apiClient.post('/seller/products', data);
  },

  update: (id: string, data: Partial<ProductItem>): Promise<ApiResponse<ProductItem>> => {
    return apiClient.put(`/seller/products/${id}`, data);
  },

  adjustStock: (id: string, data: { adjustment?: number; newQuantity?: number }): Promise<ApiResponse<ProductItem>> => {
    return apiClient.patch(`/seller/products/${id}/stock`, data);
  },

  updateStatus: (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<ApiResponse<ProductItem>> => {
    return apiClient.patch(`/seller/products/${id}/status`, { status });
  },

  delete: (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/seller/products/${id}`);
  },

  getReviews: (params: { page?: number; limit?: number } = {}): Promise<ApiResponse<PaginatedResult<ProductReview>>> => {
    return apiClient.get('/seller/products/reviews', { params });
  },

  addCompatibility: (
    id: string,
    compatibility: {
      make: string;
      model: string;
      yearFrom: number;
      yearTo: number;
      engine?: string;
      submodel?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<any>> => {
    return apiClient.post(`/seller/products/${id}/compatibility`, compatibility);
  },
};

// ---------------------------------------------------------------------------
// Customer Garage API (Authenticated Customer)
// ---------------------------------------------------------------------------

export const garageApi = {
  getVehicles: (): Promise<ApiResponse<{ vehicles: GarageVehicle[] }>> => {
    return apiClient.get('/garage/vehicles');
  },

  addVehicle: (vehicle: {
    make: string;
    model: string;
    year: number;
    submodel?: string;
    engine?: string;
    vin?: string;
    nickname?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse<{ vehicles: GarageVehicle[] }>> => {
    return apiClient.post('/garage/vehicles', vehicle);
  },

  setDefault: (vehicleId: string): Promise<ApiResponse<{ vehicles: GarageVehicle[] }>> => {
    return apiClient.put(`/garage/vehicles/${vehicleId}/default`);
  },

  removeVehicle: (vehicleId: string): Promise<ApiResponse<{ vehicles: GarageVehicle[] }>> => {
    return apiClient.delete(`/garage/vehicles/${vehicleId}`);
  },
};

// ---------------------------------------------------------------------------
// Shopping Cart API (Authenticated Customer)
// ---------------------------------------------------------------------------

export const cartApi = {
  get: (): Promise<ApiResponse<CartData>> => {
    return apiClient.get('/cart');
  },

  addItem: (data: { productId: string; quantity: number }): Promise<ApiResponse<CartData>> => {
    return apiClient.post('/cart/items', data);
  },

  updateQuantity: (itemId: string, quantity: number): Promise<ApiResponse<CartData>> => {
    return apiClient.put(`/cart/items/${itemId}`, { quantity });
  },

  removeItem: (itemId: string): Promise<ApiResponse<CartData>> => {
    return apiClient.delete(`/cart/items/${itemId}`);
  },

  merge: (items: Array<{ productId: string; quantity: number }>): Promise<ApiResponse<CartData>> => {
    return apiClient.post('/cart/merge', { items });
  },
};

// ---------------------------------------------------------------------------
// Customer Wishlist API (Authenticated Customer)
// ---------------------------------------------------------------------------

export const wishlistApi = {
  get: (): Promise<ApiResponse<WishlistData>> => {
    return apiClient.get('/wishlist');
  },

  addItem: (productId: string): Promise<ApiResponse<WishlistData>> => {
    return apiClient.post('/wishlist/items', { productId });
  },

  removeItem: (productId: string): Promise<ApiResponse<WishlistData>> => {
    return apiClient.delete(`/wishlist/items/${productId}`);
  },

  moveToCart: (productId: string, quantity: number = 1): Promise<ApiResponse<{ cart: CartData; wishlist: WishlistData }>> => {
    return apiClient.post(`/wishlist/items/${productId}/move-to-cart`, { quantity });
  },
};

// ---------------------------------------------------------------------------
// Customer Reviews API (Authenticated Customer & Admin Moderation)
// ---------------------------------------------------------------------------

export const reviewApi = {
  submit: (data: {
    productId: string;
    suborderId: string;
    rating: number;
    comment: string;
    images?: string[];
  }): Promise<ApiResponse<ProductReview>> => {
    return apiClient.post('/reviews', data);
  },

  adminList: (params: { page?: number; limit?: number; status?: string } = {}): Promise<ApiResponse<PaginatedResult<ProductReview>>> => {
    return apiClient.get('/admin/reviews', { params });
  },

  adminModerate: (
    id: string,
    data: { status: 'PUBLISHED' | 'HIDDEN_BY_ADMIN' | 'REMOVED_BY_ADMIN'; moderationReason: string }
  ): Promise<ApiResponse<ProductReview>> => {
    return apiClient.patch(`/admin/reviews/${id}/moderation`, data);
  },
};

// ---------------------------------------------------------------------------
// Taxonomies API (Categories, Brands, Vehicles)
// ---------------------------------------------------------------------------

export const taxonomyApi = {
  getCategories: (): Promise<ApiResponse<CategoryItem[]>> => {
    return apiClient.get('/categories');
  },

  adminCreateCategory: (data: Partial<CategoryItem>): Promise<ApiResponse<CategoryItem>> => {
    return apiClient.post('/categories', data);
  },

  adminUpdateCategory: (id: string, data: Partial<CategoryItem>): Promise<ApiResponse<CategoryItem>> => {
    return apiClient.put(`/categories/${id}`, data);
  },

  getBrands: (): Promise<ApiResponse<BrandItem[]>> => {
    return apiClient.get('/brands');
  },

  adminCreateBrand: (data: Partial<BrandItem>): Promise<ApiResponse<BrandItem>> => {
    return apiClient.post('/brands', data);
  },

  adminUpdateBrand: (id: string, data: Partial<BrandItem>): Promise<ApiResponse<BrandItem>> => {
    return apiClient.put(`/brands/${id}`, data);
  },

  getMakes: (): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/vehicles/makes');
  },

  getModels: (make: string): Promise<ApiResponse<string[]>> => {
    return apiClient.get('/vehicles/models', { params: { make } });
  },
};
