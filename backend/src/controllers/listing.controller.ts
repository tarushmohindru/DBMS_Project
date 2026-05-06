import { Request, Response } from 'express';
import * as ListingService from '../services/listing.service';
import { createListingSchema } from '../validators/listing.validator';
import { mapDbError } from '../services/errors';

export async function listActiveListings(req: Request, res: Response): Promise<void> {
  try {
    const listings = await ListingService.getActiveListings();
    res.json({ success: true, data: listings });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function listAllListings(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query as { status?: string };
    const seller_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
    const listings = await ListingService.getAllListings({ status, seller_id });
    res.json({ success: true, data: listings });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getListing(req: Request, res: Response): Promise<void> {
  try {
    const listing = await ListingService.getListingById(parseInt(req.params.id, 10));
    if (!listing) { res.status(404).json({ success: false, error: 'Listing not found' }); return; }
    res.json({ success: true, data: listing });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function createListing(req: Request, res: Response): Promise<void> {
  const parse = createListingSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const seller_id = req.user!.company_id!;
    const listing = await ListingService.createListing(seller_id, parse.data);
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) { res.status(e.status).json({ success: false, error: e.message, code: e.code }); return; }
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function cancelListing(req: Request, res: Response): Promise<void> {
  try {
    const listing_id = parseInt(req.params.id, 10);
    if (req.user!.role === 'marketplace_admin') {
      const result = await ListingService.adminCancelListing(listing_id);
      res.json({ success: true, data: result });
    } else {
      const seller_id = req.user!.company_id!;
      const result = await ListingService.cancelListing(listing_id, seller_id);
      res.json({ success: true, data: result });
    }
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) { res.status(e.status).json({ success: false, error: e.message, code: e.code }); return; }
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getActiveListingsCursor(req: Request, res: Response): Promise<void> {
  try {
    const listings = await ListingService.getActiveListingsCursor();
    res.json({ success: true, data: listings });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
