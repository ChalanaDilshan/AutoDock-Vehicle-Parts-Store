import { VehicleCompatibility, IVehicleCompatibility } from '../models/vehicleCompatibility.model.js';

export interface FitmentCheckResult {
  isCompatible: boolean;
  fitmentType: 'EXACT_FIT' | 'DOES_NOT_FIT' | 'UNIVERSAL_FIT';
  notes?: string | null;
}

export class VehicleService {
  public async getMakes(): Promise<string[]> {
    const makes = await VehicleCompatibility.distinct('make');
    return makes.sort();
  }

  public async getModelsByMake(make: string): Promise<string[]> {
    const models = await VehicleCompatibility.distinct('model', {
      make: make.toUpperCase().trim(),
    });
    return models.sort();
  }

  public async checkCompatibility(
    productId: string,
    make: string,
    model: string,
    year?: number
  ): Promise<FitmentCheckResult> {
    const query: Record<string, any> = {
      productId,
      make: make.toUpperCase().trim(),
      model: model.toUpperCase().trim(),
    };

    if (year !== undefined) {
      query.yearFrom = { $lte: year };
      query.yearTo = { $gte: year };
    }

    const match = await VehicleCompatibility.findOne(query);

    if (match) {
      return {
        isCompatible: true,
        fitmentType: 'EXACT_FIT',
        notes: match.compatibilityNotes,
      };
    }

    return {
      isCompatible: false,
      fitmentType: 'DOES_NOT_FIT',
      notes: 'No compatibility record found for the specified vehicle.',
    };
  }

  public async addCompatibility(
    productId: string,
    data: Partial<IVehicleCompatibility>
  ): Promise<IVehicleCompatibility> {
    return VehicleCompatibility.create({
      ...data,
      productId,
    });
  }

  public async getProductCompatibilities(productId: string): Promise<IVehicleCompatibility[]> {
    return VehicleCompatibility.find({ productId }).sort({ make: 1, model: 1, yearFrom: 1 });
  }
}

export const vehicleService = new VehicleService();
