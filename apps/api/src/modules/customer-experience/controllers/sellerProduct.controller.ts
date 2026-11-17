import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import {
  CreateProductSchema,
  UpdateProductSchema,
  AdjustStockSchema,
  ProductStatusSchema,
} from '../validators/product.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function createProduct(
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
        message: 'You must have an active seller profile to create products',
      });
      return;
    }

    const parseResult = CreateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Product validation failed',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const product = await productService.createSellerProduct(sellerId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'PRODUCT_CREATED',
      message: 'Product created successfully',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function listSellerProducts(
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

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const status = req.query.status as any;

    const result = await productService.getSellerProducts(sellerId, page, limit, status);

    sendSuccess({
      res,
      code: 'SELLER_PRODUCTS_RETRIEVED',
      message: "Seller's products retrieved successfully",
      data: result.products,
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSellerProduct(
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

    const product = await productService.getSellerProductById(sellerId, req.params.id);
    if (!product) {
      sendError({
        res,
        statusCode: 404,
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
      return;
    }

    sendSuccess({
      res,
      code: 'SELLER_PRODUCT_RETRIEVED',
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSellerProduct(
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

    const parseResult = UpdateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const updated = await productService.updateSellerProduct(
      sellerId,
      req.params.id,
      parseResult.data
    );

    sendSuccess({
      res,
      code: 'PRODUCT_UPDATED',
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function adjustStock(
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

    const parseResult = AdjustStockSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Stock value must be a non-negative integer',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const updated = await productService.adjustStock(
      sellerId,
      req.params.id,
      parseResult.data.stock,
      parseResult.data.lowStockThreshold
    );

    sendSuccess({
      res,
      code: 'STOCK_ADJUSTED',
      message: 'Product inventory adjusted successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
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

    const parseResult = ProductStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid status',
      });
      return;
    }

    const updated = await productService.updateStatus(
      sellerId,
      req.params.id,
      parseResult.data.status
    );

    sendSuccess({
      res,
      code: 'STATUS_UPDATED',
      message: 'Product status updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
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

    await productService.softDeleteProduct(sellerId, req.params.id);

    sendSuccess({
      res,
      code: 'PRODUCT_DEACTIVATED',
      message: 'Product deactivated successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}
