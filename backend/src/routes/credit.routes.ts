import { Router } from 'express';
import { listCredits, getCredit, getCreditsByCompany, getCreditSummary } from '../controllers/credit.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/',              authenticate, listCredits);
router.get('/summary',       authenticate, getCreditSummary);
router.get('/company/:id',   authenticate, getCreditsByCompany);
router.get('/:id',           authenticate, getCredit);

export default router;
