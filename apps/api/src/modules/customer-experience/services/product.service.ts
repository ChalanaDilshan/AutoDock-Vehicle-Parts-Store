import mongoose from 'mongoose';
import { Product, IProduct, ProductStatus } from '../models/product.model.js';
import { VehicleCompatibility } from '../models/vehicleCompatibility.model.js';
import { identityPublicService } from '../../identity/index.js';

export interface SearchProductsOptions {
  q?: string;
  categoryId?: string;
  brandId?: string;
  sellerId?: string;
  make?: string;
  model?: string;
  year?: number;
  minPriceInCents?: number;
  maxPriceInCents?: number;
  condition?: string;
  page?: number;
  limit?: number;
  sortBy?: 'priceInCents' | 'averageRating' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class ProductService {
  public async searchProducts(options: SearchProductsOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      status: 'ACTIVE',
    };

    // Keyword text search
    if (options.q && options.q.trim()) {
      filter.$text = { $search: options.q.trim() };
    }

    if (options.categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(options.categoryId);
    }

    if (options.brandId) {
      filter.brandId = new mongoose.Types.ObjectId(options.brandId);
    }

    if (options.sellerId) {
      filter.sellerId = new mongoose.Types.ObjectId(options.sellerId);
    }

    if (options.condition) {
      filter.condition = options.condition;
    }

    // Price range filters in integer cents
    if (options.minPriceInCents !== undefined || options.maxPriceInCents !== undefined) {
      filter.priceInCents = {};
      if (options.minPriceInCents !== undefined) {
        filter.priceInCents.$gte = options.minPriceInCents;
      }
      if (options.maxPriceInCents !== undefined) {
        filter.priceInCents.$lte = options.maxPriceInCents;
      }
    }

    // Vehicle fitment filtering
    if (options.make || options.model || options.year) {
      const vehicleQuery: Record<string, any> = {};
      if (options.make) vehicleQuery.make = options.make.toUpperCase().trim();
      if (options.model) vehicleQuery.model = options.model.toUpperCase().trim();
      if (options.year) {
        vehicleQuery.yearFrom = { $lte: options.year };
        vehicleQuery.yearTo = { $gte: options.year };
      }

      const compatibleProductIds = await VehicleCompatibility.distinct('productId', vehicleQuery);
      filter._id = { $in: compatibleProductIds };
    }

    // Sort criteria
    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

    const [products, totalRecords] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name slug')
        .populate('brandId', 'name slug logoUrl')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      products: products.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        sku: p.sku,
        partNumber: p.partNumber,
        priceInCents: p.priceInCents,
        stock: p.stock,
        condition: p.condition,
        images: p.images,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        status: p.status,
        category: p.categoryId,
        brand: p.brandId,
        sellerId: p.sellerId.toString(),
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async getProductById(id: string) {
    const product = await Product.findById(id)
      .populate('categoryId', 'name slug description')
      .populate('brandId', 'name slug logoUrl countryOfOrigin')
      .lean();

    if (!product) {
      return null;
    }

    // Retrieve sanitized public seller profile via MOD-01 contract
    const sellerProfile = await identityPublicService.getSellerPublicProfile(
      product.sellerId.toString()
    );

    return {
      id: product._id.toString(),
      title: product.title,
      sku: product.sku,
      partNumber: product.partNumber,
      priceInCents: product.priceInCents,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      condition: product.condition,
      description: product.description,
      images: product.images,
      specifications: product.specifications,
      warrantyMonths: product.warrantyMonths,
      weightGrams: product.weightGrams,
      status: product.status,
      averageRating: product.averageRating,
      reviewCount: product.reviewCount,
      category: product.categoryId,
      brand: product.brandId,
      seller: sellerProfile,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  public async createSellerProduct(sellerId: string, data: any): Promise<IProduct> {
    // Enforce MOD-01 seller selling eligibility gate
    const eligibility = await identityPublicService.isSellerEligibleToSell(sellerId);
    if (!eligibility.isEligible) {
      const err = new Error(
        eligibility.rejectionOrSuspensionReason ||
          'Seller account is not eligible to publish or sell products'
      );
      (err as any).statusCode = 403;
      (err as any).code = 'SELLER_NOT_ELIGIBLE_TO_SELL';
      throw err;
    }

    // Enforce SKU uniqueness per seller store
    const existingSku = await Product.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      sku: data.sku,
    });

    if (existingSku) {
      const err = new Error(`Product with SKU '${data.sku}' already exists in your store`);
      (err as any).statusCode = 409;
      (err as any).code = 'SKU_ALREADY_EXISTS';
      throw err;
    }

    const { compatibleVehicles, ...productData } = data;

    const product = await Product.create({
      ...productData,
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: data.status || 'ACTIVE',
      averageRating: 0,
      reviewCount: 0,
    });

    // Create compatibility records if supplied
    if (compatibleVehicles && Array.isArray(compatibleVehicles) && compatibleVehicles.length > 0) {
      const compatRecords = compatibleVehicles.map((v) => ({
        ...v,
        productId: product._id,
      }));
      await VehicleCompatibility.insertMany(compatRecords);
    }

    return product;
  }

  public async getSellerProducts(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
    status?: ProductStatus
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
    };

    if (status) {
      filter.status = status;
    }

    const [products, totalRecords] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name')
        .populate('brandId', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / safeLimit) || 1;

    return {
      products: products.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        sku: p.sku,
        partNumber: p.partNumber,
        priceInCents: p.priceInCents,
        stock: p.stock,
        lowStockThreshold: p.lowStockThreshold,
        condition: p.condition,
        status: p.status,
        images: p.images,
        category: p.categoryId,
        brand: p.brandId,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalRecords,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  public async getSellerProductById(sellerId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) {
      return null;
    }

    // Strict IDOR ownership check
    if (product.sellerId.toString() !== sellerId) {
      const err = new Error('You do not have permission to access this product');
      (err as any).statusCode = 403;
      (err as any).code = 'PRODUCT_ACCESS_DENIED';
      throw err;
    }

    return product;
  }

  public async updateSellerProduct(sellerId: string, productId: string, data: any) {
    const product = await this.getSellerProductById(sellerId, productId);
    if (!product) {
      const err = new Error('Product not found');
      (err as any).statusCode = 404;
      (err as any).code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    if (data.sku && data.sku !== product.sku) {
      const existingSku = await Product.findOne({
        sellerId: new mongoose.Types.ObjectId(sellerId),
        sku: data.sku,
        _id: { $ne: product._id },
      });
      if (existingSku) {
        const err = new Error(`Product with SKU '${data.sku}' already exists in your store`);
        (err as any).statusCode = 409;
        (err as any).code = 'SKU_ALREADY_EXISTS';
        throw err;
      }
    }

    // Prevent direct manipulation of privileged fields
    delete data.sellerId;
    delete data.averageRating;
    delete data.reviewCount;
    delete data._id;

    return Product.findByIdAndUpdate(productId, { $set: data }, { new: true, runValidators: true });
  }

  public async adjustStock(
    sellerId: string,
    productId: string,
    stock: number,
    lowStockThreshold?: number
  ) {
    const product = await this.getSellerProductById(sellerId, productId);
    if (!product) {
      const err = new Error('Product not found');
      (err as any).statusCode = 404;
      (err as any).code = 'PRODUCT_NOT_FOUND';
      throw err;
    }

    const update: Record<string, any> = { stock };
    if (lowStockThreshold !== undefined) {
      update.lowStockThreshold = lowStockThreshold;
    }

    if (stock === 0 && product.status === 'ACTIVE') {
      update.status = 'OUT_OF_STOCK';
    } else if (stock > 0 && product.status === 'OUT_OF_STOCK') {
      update.status = 'ACTIVE';
    }

    return Product.findByIdAndUpdate(productId, { $set: update }, { new: true });
  }

  public async updateStatus(sellerId: string, productId: string, status: ProductStatus) {
    await this.getSellerProductById(sellerId, productId);
    return Product.findByIdAndUpdate(productId, { $set: { status } }, { new: true });
  }

  public async softDeleteProduct(sellerId: string, productId: string) {
    await this.getSellerProductById(sellerId, productId);
    return Product.findByIdAndUpdate(productId, { $set: { status: 'INACTIVE' } }, { new: true });
  }

  public async adminModerateProduct(productId: string, action: 'SUSPEND' | 'ACTIVATE') {
    const status = action === 'SUSPEND' ? 'INACTIVE' : 'ACTIVE';
    return Product.findByIdAndUpdate(productId, { $set: { status } }, { new: true });
  }
}

export const productService = new ProductService();
