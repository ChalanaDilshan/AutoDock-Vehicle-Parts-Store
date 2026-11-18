import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { paymentService } from '../services/payment.service.js';
import { receiptStorageService } from '../services/receiptStorage.service.js';
import { OrderQuerySchema, CancelSuborderSchema } from '../validators/order.validator.js';
import { UploadPaymentReceiptSchema } from '../validators/payment.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export class OrderController {
  public async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = OrderQuerySchema.parse(req.query);
      const result = await orderService.getCustomerOrders(req.user!.userId, query);

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

  public async getMyOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await orderService.getCustomerOrderById(req.user!.userId, req.params.id);

      sendSuccess({
        res,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMySuborderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const suborder = await orderService.getCustomerSuborderById(
        req.user!.userId,
        req.params.suborderId
      );

      sendSuccess({
        res,
        data: suborder,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getBankInstructions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const instructions = await paymentService.getBankTransferInstructions(
        req.user!.userId,
        req.params.suborderId
      );

      sendSuccess({
        res,
        code: 'BANK_INSTRUCTIONS_RETRIEVED',
        message: 'Verified bank deposit instructions retrieved',
        data: instructions,
      });
    } catch (err) {
      next(err);
    }
  }

  public async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UploadPaymentReceiptSchema.parse(req.body);

      let buffer: Buffer;
      if (validated.fileContentBase64) {
        buffer = Buffer.from(validated.fileContentBase64, 'base64');
      } else {
        buffer = Buffer.from('synthetic receipt content');
      }

      const slip = await paymentService.uploadBankTransferReceipt(
        req.user!.userId,
        req.params.suborderId,
        {
          originalName: validated.fileName,
          mimeType: validated.mimeType,
          size: validated.fileSizeBytes,
          buffer,
          depositedAmountInCents: validated.depositedAmountInCents,
          referenceNumber: validated.referenceNumber,
        }
      );

      sendSuccess({
        res,
        statusCode: 201,
        code: 'RECEIPT_UPLOADED',
        message: 'Bank transfer slip uploaded. Awaiting seller verification.',
        data: {
          receiptId: slip._id.toString(),
          suborderId: slip.suborderId.toString(),
          verificationStatus: slip.verificationStatus,
          uploadedAt: slip.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async cancelSuborder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CancelSuborderSchema.parse(req.body);
      const suborder = await orderService.cancelSuborder(
        req.user!.userId,
        req.params.suborderId,
        validated
      );

      sendSuccess({
        res,
        code: 'SUBORDER_CANCELLED',
        message: 'Suborder has been cancelled and reserved stock restored',
        data: suborder,
      });
    } catch (err) {
      next(err);
    }
  }

  public async streamReceipt(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const key = req.query.key as string;
      const expires = Number(req.query.expires);
      const token = req.query.token as string;

      if (!key || !expires || !token) {
        sendError({
          res,
          statusCode: 400,
          code: 'BAD_REQUEST',
          message: 'Missing required streaming parameters',
        });
        return;
      }

      const isValid = receiptStorageService.verifyStreamToken(key, expires, token);
      if (!isValid) {
        sendError({
          res,
          statusCode: 403,
          code: 'FORBIDDEN',
          message: 'Invalid or expired receipt view token',
        });
        return;
      }

      const { buffer, mimeType } = await receiptStorageService.getFileBuffer(key);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'private, no-cache, no-store');
      res.send(buffer);
    } catch {
      sendError({
        res,
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Receipt file not found',
      });
    }
  }
}

export const orderController = new OrderController();
