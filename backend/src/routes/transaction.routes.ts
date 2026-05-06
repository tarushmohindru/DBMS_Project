import { Router } from 'express';
import { listTransactions, getTransaction, executePurchase } from '../controllers/transaction.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/',
  authenticate,
  listTransactions);

router.post('/',
  authenticate,
  authorize('company_admin'),
  executePurchase);

router.get('/:id',
  authenticate,
  getTransaction);

export default router;
