import { Request, Response, NextFunction } from 'express';
import { vehicleService } from '../services/vehicle.service.js';
import { productService } from '../services/product.service.js';
import { AddCompatibilitySchema } from '../validators/product.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getVehicleMakes(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const makes = await vehicleService.getMakes();
    sendSuccess({
      res,
      code: 'VEHICLE_MAKES_RETRIEVED',
      message: 'Vehicle makes retrieved successfully',
      data: makes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getModelsByMake(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { make } = req.query;
    if (!make) {
      sendError({
        res,
        statusCode: 400,
        code: 'MISSING_MAKE_PARAMETER',
        message: 'Vehicle make query parameter is required',
      });
      return;
    }

    const models = await vehicleService.getModelsByMake(make as string);
    sendSuccess({
      res,
      code: 'VEHICLE_MODELS_RETRIEVED',
      message: `Models for make ${make} retrieved successfully`,
      data: models,
    });
  } catch (err) {
    next(err);
  }
}

export async function addProductCompatibility(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = req.user?.sellerId;
    if (!sellerId) {
      sendError({
        res,
        statusCode: 403,
        code: 'SELLER_PROFILE_REQUIRED',
        message: 'Seller profile required',
      });
      return;
    }

    const { id } = req.params;
    // Verify product ownership
    await productService.getSellerProductById(sellerId, id);

    const parseResult = AddCompatibilitySchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid compatibility data',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const record = await vehicleService.addCompatibility(id, parseResult.data as any);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'COMPATIBILITY_ADDED',
      message: 'Vehicle compatibility mapping added successfully',
      data: record,
    });
  } catch (err) {
    next(err);
  }
}
