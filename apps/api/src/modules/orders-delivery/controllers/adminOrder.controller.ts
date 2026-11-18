import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { OrderQuerySchema } from '../validators/order.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class AdminOrderController {
  public async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = OrderQuerySchema.parse(req.query);
      const result = await orderService.getAdminOrders(query);

      sendSuccess({
        res,
        data: result.orders,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getAdminOrderById(req.params.orderId);

      sendSuccess({
        res,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminOrderController = new AdminOrderController();
