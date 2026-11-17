import { Request, Response, NextFunction } from 'express';
import { brandService } from '../services/brand.service.js';
import { CreateBrandSchema, UpdateBrandSchema } from '../validators/brand.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getAllBrands(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const brands = await brandService.getAllBrands();
    sendSuccess({
      res,
      code: 'BRANDS_RETRIEVED',
      message: 'Brands retrieved successfully',
      data: brands,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = CreateBrandSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid brand data',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const brand = await brandService.createBrand(parseResult.data as any);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'BRAND_CREATED',
      message: 'Brand created successfully',
      data: brand,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateBrand(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = UpdateBrandSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid brand update data',
      });
      return;
    }

    const updated = await brandService.updateBrand(req.params.id, parseResult.data as any);
    if (!updated) {
      sendError({
        res,
        statusCode: 404,
        code: 'BRAND_NOT_FOUND',
        message: 'Brand not found',
      });
      return;
    }

    sendSuccess({
      res,
      code: 'BRAND_UPDATED',
      message: 'Brand updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
