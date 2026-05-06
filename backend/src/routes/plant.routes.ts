import { Router } from 'express';
import {
  listPlants, getPlant, createPlant, verifyPlant, getPlantAuditLog,
} from '../controllers/plant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/',
  authenticate,
  listPlants);

router.post('/',
  authenticate,
  authorize('company_admin'),
  createPlant);

router.get('/:id',
  authenticate,
  getPlant);

router.put('/:id/verify',
  authenticate,
  authorize('regulatory_authority'),
  verifyPlant);

router.get('/:id/audit-log',
  authenticate,
  authorize('regulatory_authority', 'marketplace_admin'),
  getPlantAuditLog);

export default router;
