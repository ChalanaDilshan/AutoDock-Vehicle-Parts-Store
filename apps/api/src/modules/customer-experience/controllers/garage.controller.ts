import { Request, Response, NextFunction } from 'express';
import { customerGarageService } from '../services/garage.service.js';
import { AddGarageVehicleSchema } from '../validators/garage.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getCustomerGarage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const garage = await customerGarageService.getGarage(userId);

    sendSuccess({
      res,
      code: 'GARAGE_RETRIEVED',
      message: 'Customer garage retrieved successfully',
      data: {
        garageId: garage._id.toString(),
        vehicles: garage.vehicles,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function addGarageVehicle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const parseResult = AddGarageVehicleSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid vehicle data',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const garage = await customerGarageService.addVehicle(userId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'VEHICLE_ADDED_TO_GARAGE',
      message: 'Vehicle added to My Garage successfully',
      data: {
        garageId: garage._id.toString(),
        vehicles: garage.vehicles,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultGarageVehicle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { vehicleId } = req.params;

    const garage = await customerGarageService.setDefaultVehicle(userId, vehicleId);

    sendSuccess({
      res,
      code: 'DEFAULT_VEHICLE_UPDATED',
      message: 'Default vehicle updated successfully',
      data: {
        garageId: garage._id.toString(),
        vehicles: garage.vehicles,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function removeGarageVehicle(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { vehicleId } = req.params;

    const garage = await customerGarageService.removeVehicle(userId, vehicleId);

    sendSuccess({
      res,
      code: 'VEHICLE_REMOVED_FROM_GARAGE',
      message: 'Vehicle removed from My Garage successfully',
      data: {
        garageId: garage._id.toString(),
        vehicles: garage.vehicles,
      },
    });
  } catch (err) {
    next(err);
  }
}
