import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service.js';
import { CreateCategorySchema, UpdateCategorySchema } from '../validators/category.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function getCategoryTree(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const tree = await categoryService.getCategoryTree();
    sendSuccess({
      res,
      code: 'CATEGORY_TREE_RETRIEVED',
      message: 'Category hierarchy retrieved successfully',
      data: tree,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = CreateCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid category data',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const category = await categoryService.createCategory(parseResult.data as any);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'CATEGORY_CREATED',
      message: 'Category created successfully',
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parseResult = UpdateCategorySchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid category update data',
      });
      return;
    }

    const updated = await categoryService.updateCategory(req.params.id, parseResult.data as any);
    if (!updated) {
      sendError({
        res,
        statusCode: 404,
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found',
      });
      return;
    }

    sendSuccess({
      res,
      code: 'CATEGORY_UPDATED',
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
