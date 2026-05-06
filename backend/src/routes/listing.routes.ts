import { Router } from 'express';
import {
  listActiveListings, listAllListings, getListing,
  createListing, cancelListing, getActiveListingsCursor,
} from '../controllers/listing.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/',
  authenticate,
  listActiveListings);

router.get('/all',
  authenticate,
  listAllListings);

router.get('/cursor',
  authenticate,
  getActiveListingsCursor);

router.post('/',
  authenticate,
  authorize('company_admin'),
  createListing);

router.get('/:id',
  authenticate,
  getListing);

router.delete('/:id',
  authenticate,
  authorize('company_admin', 'marketplace_admin'),
  cancelListing);

export default router;
