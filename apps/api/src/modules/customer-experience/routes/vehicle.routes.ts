import { Router } from 'express';
import { getVehicleMakes, getModelsByMake } from '../controllers/vehicle.controller.js';

export const vehicleRouter = Router();

// Public: Get unique makes
vehicleRouter.get('/makes', getVehicleMakes);

// Public: Get models for specified make
vehicleRouter.get('/models', getModelsByMake);
