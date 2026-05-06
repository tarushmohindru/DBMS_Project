import { Router } from 'express';
import authRoutes        from './auth.routes';
import companyRoutes     from './company.routes';
import plantRoutes       from './plant.routes';
import productionRoutes  from './productionLog.routes';
import creditRoutes      from './credit.routes';
import walletRoutes      from './wallet.routes';
import listingRoutes     from './listing.routes';
import transactionRoutes from './transaction.routes';
import complianceRoutes  from './compliance.routes';
import analyticsRoutes   from './analytics.routes';

const router = Router();

router.use('/auth',               authRoutes);
router.use('/companies',          companyRoutes);
router.use('/plants',             plantRoutes);
router.use('/production-logs',    productionRoutes);
router.use('/credits',            creditRoutes);
router.use('/wallet',             walletRoutes);
router.use('/listings',           listingRoutes);
router.use('/transactions',       transactionRoutes);
router.use('/compliance-reports', complianceRoutes);
router.use('/analytics',          analyticsRoutes);

export default router;
