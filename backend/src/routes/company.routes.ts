import { Router } from 'express';
import { listCompanies, getCompany, registerCompany } from '../controllers/company.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/',    registerCompany);   // Public — new company registration
router.get('/',     authenticate, listCompanies);
router.get('/:id',  authenticate, getCompany);

export default router;
