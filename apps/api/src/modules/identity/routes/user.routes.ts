import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', userController.getProfile);
userRouter.put('/me', userController.updateProfile);
