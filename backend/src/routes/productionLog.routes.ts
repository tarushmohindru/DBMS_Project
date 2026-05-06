import { Router } from 'express';
import { listLogs, getLog, createLog, verifyLog } from '../controllers/productionLog.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/',
  authenticate,
  listLogs);

router.post('/',
  authenticate,
  authorize('company_admin'),
  createLog);

router.get('/:id',
  authenticate,
  getLog);

router.put('/:id/verify',
  authenticate,
  authorize('regulatory_authority'),
  verifyLog);

export default router;
