import { Router } from 'express';
import {
  getCustomerGarage,
  addGarageVehicle,
  setDefaultGarageVehicle,
  removeGarageVehicle,
} from '../controllers/garage.controller.js';
import { requireAuth, requireRole } from '../../identity/index.js';

export const garageRouter = Router();

// Customer only routes
garageRouter.use(requireAuth);
garageRouter.use(requireRole('CUSTOMER'));

garageRouter.get('/vehicles', getCustomerGarage);
garageRouter.post('/vehicles', addGarageVehicle);
garageRouter.put('/vehicles/:vehicleId/default', setDefaultGarageVehicle);
garageRouter.delete('/vehicles/:vehicleId', removeGarageVehicle);
