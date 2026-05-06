import { Router } from 'express';
import { getWallet, getWalletHistory } from '../controllers/wallet.controller';
import { authenticate, authorize, ownCompanyOnly } from '../middleware/auth';

const router = Router();

router.get('/:company_id',
  authenticate,
  authorize('company_admin', 'marketplace_admin'),
  ownCompanyOnly,
  getWallet);

router.get('/:company_id/history',
  authenticate,
  authorize('company_admin', 'marketplace_admin'),
  ownCompanyOnly,
  getWalletHistory);

export default router;
