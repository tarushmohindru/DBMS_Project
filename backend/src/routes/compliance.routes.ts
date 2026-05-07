import { Router } from 'express';
import {
  listReports, getReport, generateReport, auditReport,
  getComplianceSummary, getPeriodicSummary, listAuthorities,
} from '../controllers/compliance.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/authorities',
  listAuthorities);

router.get('/summary',
  authenticate,
  authorize('regulatory_authority', 'marketplace_admin'),
  getComplianceSummary);

router.get('/periodic/:authority_id',
  authenticate,
  authorize('regulatory_authority', 'marketplace_admin'),
  getPeriodicSummary);

router.get('/',
  authenticate,
  listReports);

router.post('/',
  authenticate,
  authorize('company_admin'),
  generateReport);

router.get('/:id',
  authenticate,
  getReport);

router.put('/:id/audit',
  authenticate,
  authorize('regulatory_authority'),
  auditReport);

export default router;
