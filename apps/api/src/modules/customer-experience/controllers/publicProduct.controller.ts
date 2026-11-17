import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { productService } from '../services/product.service.js';
import { vehicleService } from '../services/vehicle.service.js';
import { SearchProductsQuerySchema } from '../validators/search.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function searchProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = SearchProductsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'INVALID_QUERY_PARAMETERS',
        message: 'Invalid product search query parameters',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const { products, pagination } = await productService.searchProducts(parseResult.data);

    sendSuccess({
      res,
      code: 'PRODUCTS_RETRIEVED',
      message: 'Product listings retrieved successfully',
      data: products,
      meta: { pagination },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError({
        res,
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product with the specified ID was not found',
      });
      return;
    }

    const product = await productService.getProductById(id);

    if (!product || product.status !== 'ACTIVE') {
      sendError({
        res,
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product with the specified ID was not found',
      });
      return;
    }

    sendSuccess({
      res,
      code: 'PRODUCT_DETAIL_RETRIEVED',
      message: 'Product details retrieved successfully',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkProductFitment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { make, model, year } = req.query;

    if (!make || !model) {
      sendError({
        res,
        statusCode: 400,
        code: 'MISSING_VEHICLE_PARAMETERS',
        message: 'Vehicle make and model are required for fitment check',
      });
      return;
    }

    const parsedYear = year ? parseInt(year as string, 10) : undefined;
    const result = await vehicleService.checkCompatibility(
      id,
      make as string,
      model as string,
      parsedYear
    );

    sendSuccess({
      res,
      code: 'FITMENT_CHECK_COMPLETE',
      message: 'Vehicle fitment check completed',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
