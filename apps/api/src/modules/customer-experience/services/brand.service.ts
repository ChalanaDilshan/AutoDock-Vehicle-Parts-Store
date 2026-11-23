import { Brand, IBrand } from '../models/brand.model.js';

export class BrandService {
  public async getAllBrands(): Promise<IBrand[]> {
    return Brand.find({ isActive: true }).sort({ name: 1 });
  }

  public async getBrandById(id: string): Promise<IBrand | null> {
    return Brand.findById(id);
  }

  public async createBrand(data: Partial<IBrand>): Promise<IBrand> {
    const existingSlug = await Brand.findOne({ slug: data.slug });
    if (existingSlug) {
      const err = new Error('A brand with this slug already exists');
      (err as any).statusCode = 409;
      (err as any).code = 'BRAND_SLUG_EXISTS';
      throw err;
    }

    const existingName = await Brand.findOne({ name: data.name });
    if (existingName) {
      const err = new Error('A brand with this name already exists');
      (err as any).statusCode = 409;
      (err as any).code = 'BRAND_NAME_EXISTS';
      throw err;
    }

    return Brand.create(data);
  }

  public async updateBrand(id: string, data: Partial<IBrand>): Promise<IBrand | null> {
    return Brand.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }
}

export const brandService = new BrandService();
