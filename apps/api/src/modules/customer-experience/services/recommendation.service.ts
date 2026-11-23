import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { CustomerGarage } from '../models/customerGarage.model.js';
import { VehicleCompatibility } from '../models/vehicleCompatibility.model.js';

export class RecommendationService {
  public async getRecommendations(
    userId?: string,
    productId?: string,
    limit: number = 8
  ) {
    const safeLimit = Math.min(20, Math.max(1, limit));

    // Rule 1: Active Garage Vehicle Fitment
    if (userId) {
      const garage = await CustomerGarage.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (garage && garage.vehicles.length > 0) {
        const defaultVehicle =
          garage.vehicles.find((v) => v.isDefault) || garage.vehicles[0];

        const compatibleIds = await VehicleCompatibility.distinct('productId', {
          make: defaultVehicle.make,
          model: defaultVehicle.model,
          yearFrom: { $lte: defaultVehicle.year },
          yearTo: { $gte: defaultVehicle.year },
        });

        if (compatibleIds.length > 0) {
          const products = await Product.find({
            _id: { $in: compatibleIds },
            status: 'ACTIVE',
            ...(productId ? { _id: { $ne: new mongoose.Types.ObjectId(productId) } } : {}),
          })
            .populate('categoryId', 'name')
            .populate('brandId', 'name')
            .sort({ averageRating: -1, reviewCount: -1 })
            .limit(safeLimit)
            .lean();

          if (products.length > 0) {
            return {
              ruleApplied: 'ACTIVE_GARAGE_FITMENT',
              context: {
                make: defaultVehicle.make,
                model: defaultVehicle.model,
                year: defaultVehicle.year,
                nickname: defaultVehicle.nickname,
              },
              products: products.map((p) => ({
                id: p._id.toString(),
                title: p.title,
                sku: p.sku,
                priceInCents: p.priceInCents,
                stock: p.stock,
                primaryImageUrl:
                  p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url,
                averageRating: p.averageRating,
                reviewCount: p.reviewCount,
                category: p.categoryId,
                brand: p.brandId,
              })),
            };
          }
        }
      }
    }

    // Rule 2: Category & Brand Affinity
    if (productId) {
      const currentProduct = await Product.findById(productId).lean();
      if (currentProduct) {
        const related = await Product.find({
          _id: { $ne: currentProduct._id },
          categoryId: currentProduct.categoryId,
          status: 'ACTIVE',
        })
          .populate('categoryId', 'name')
          .populate('brandId', 'name')
          .sort({ brandId: currentProduct.brandId ? -1 : 1, averageRating: -1 })
          .limit(safeLimit)
          .lean();

        if (related.length > 0) {
          return {
            ruleApplied: 'CATEGORY_AFFINITY',
            context: {
              categoryId: currentProduct.categoryId.toString(),
            },
            products: related.map((p) => ({
              id: p._id.toString(),
              title: p.title,
              sku: p.sku,
              priceInCents: p.priceInCents,
              stock: p.stock,
              primaryImageUrl:
                p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url,
              averageRating: p.averageRating,
              reviewCount: p.reviewCount,
              category: p.categoryId,
              brand: p.brandId,
            })),
          };
        }
      }
    }

    // Rule 3: Platform Popularity Fallback
    const popular = await Product.find({ status: 'ACTIVE' })
      .populate('categoryId', 'name')
      .populate('brandId', 'name')
      .sort({ averageRating: -1, reviewCount: -1, createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return {
      ruleApplied: 'POPULAR_ITEMS',
      context: null,
      products: popular.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        sku: p.sku,
        priceInCents: p.priceInCents,
        stock: p.stock,
        primaryImageUrl:
          p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url,
        averageRating: p.averageRating,
        reviewCount: p.reviewCount,
        category: p.categoryId,
        brand: p.brandId,
      })),
    };
  }
}

export const recommendationService = new RecommendationService();
