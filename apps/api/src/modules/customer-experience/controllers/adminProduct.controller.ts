import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function adminModerateProduct(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['SUSPEND', 'ACTIVATE'].includes(action)) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Action must be SUSPEND or ACTIVATE',
      });
      return;
    }

    const updated = await productService.adminModerateProduct(id, action);
    if (!updated) {
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
      code: 'PRODUCT_MODERATED',
      message: `Product successfully ${action === 'SUSPEND' ? 'suspended' : 'activated'}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
