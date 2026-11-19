import { Router } from 'express';
import { financePublicController } from '../controllers/financePublic.controller.js';

export const financePublicRouter = Router();

financePublicRouter.get('/health', (req, res) => financePublicController.getHealth(req, res));
financePublicRouter.get('/platform-bank-account', (req, res, next) =>
  financePublicController.getPlatformBankAccount(req, res, next)
);
