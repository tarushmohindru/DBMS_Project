import { Router } from 'express';
import {
  getDashboardKPIs, getTopBuyers, getCreditIssuanceTrends,
  getMarketplaceVolume, getCompanyPerformance, getFullAnalytics, getPublicSummary,
} from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/public-summary', getPublicSummary);

router.get('/dashboard',
  authenticate,
  getDashboardKPIs);

router.get('/reports',
  authenticate,
  authorize('marketplace_admin', 'regulatory_authority'),
  getFullAnalytics);

router.get('/top-buyers',
  authenticate,
  authorize('marketplace_admin'),
  getTopBuyers);

router.get('/credit-summary',
  authenticate,
  getCreditIssuanceTrends);

router.get('/marketplace-volume',
  authenticate,
  authorize('marketplace_admin'),
  getMarketplaceVolume);

router.get('/company-performance',
  authenticate,
  authorize('marketplace_admin', 'regulatory_authority'),
  getCompanyPerformance);

export default router;
