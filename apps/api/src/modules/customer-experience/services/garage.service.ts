import mongoose from 'mongoose';
import { CustomerGarage, ICustomerGarage, IGarageVehicle } from '../models/customerGarage.model.js';

export class CustomerGarageService {
  public async getGarage(userId: string): Promise<ICustomerGarage> {
    let garage = await CustomerGarage.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!garage) {
      garage = await CustomerGarage.create({
        userId: new mongoose.Types.ObjectId(userId),
        vehicles: [],
      });
    }

    return garage;
  }

  public async addVehicle(userId: string, vehicleData: any): Promise<ICustomerGarage> {
    const garage = await this.getGarage(userId);

    if (garage.vehicles.length >= 10) {
      const err = new Error('You have reached the maximum limit of 10 saved vehicles in My Garage');
      (err as any).statusCode = 400;
      (err as any).code = 'GARAGE_MAX_LIMIT_REACHED';
      throw err;
    }

    // If this is marked as default or is the first vehicle, reset other defaults
    const isDefault = vehicleData.isDefault || garage.vehicles.length === 0;

    if (isDefault) {
      garage.vehicles.forEach((v) => {
        v.isDefault = false;
      });
    }

    const newVehicle = {
      _id: new mongoose.Types.ObjectId(),
      make: vehicleData.make.toUpperCase().trim(),
      model: vehicleData.model.toUpperCase().trim(),
      year: vehicleData.year,
      engine: vehicleData.engine?.toUpperCase()?.trim() || null,
      vin: vehicleData.vin?.toUpperCase()?.trim() || null,
      nickname: vehicleData.nickname?.trim() || null,
      isDefault,
    };

    garage.vehicles.push(newVehicle as IGarageVehicle);
    return garage.save();
  }

  public async setDefaultVehicle(userId: string, vehicleId: string): Promise<ICustomerGarage> {
    const garage = await this.getGarage(userId);

    let found = false;
    garage.vehicles.forEach((v) => {
      if (v._id.toString() === vehicleId) {
        v.isDefault = true;
        found = true;
      } else {
        v.isDefault = false;
      }
    });

    if (!found) {
      const err = new Error('Vehicle not found in your garage');
      (err as any).statusCode = 404;
      (err as any).code = 'VEHICLE_NOT_FOUND';
      throw err;
    }

    return garage.save();
  }

  public async removeVehicle(userId: string, vehicleId: string): Promise<ICustomerGarage> {
    const garage = await this.getGarage(userId);

    const vehicleIndex = garage.vehicles.findIndex((v) => v._id.toString() === vehicleId);
    if (vehicleIndex === -1) {
      const err = new Error('Vehicle not found in your garage');
      (err as any).statusCode = 404;
      (err as any).code = 'VEHICLE_NOT_FOUND';
      throw err;
    }

    const wasDefault = garage.vehicles[vehicleIndex].isDefault;
    garage.vehicles.splice(vehicleIndex, 1);

    // If default vehicle was removed and others remain, set first as default
    if (wasDefault && garage.vehicles.length > 0) {
      garage.vehicles[0].isDefault = true;
    }

    return garage.save();
  }
}

export const customerGarageService = new CustomerGarageService();
