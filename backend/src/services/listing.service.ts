import { pool } from '../config/db';
import { CreateListingInput } from '../validators/listing.validator';

export async function getActiveListings() {
  const result = await pool.query(
    `SELECT listing_id, seller_id, seller_name, seller_reg_no, credit_id,
            original_credits, credits_available AS quantity, credits_available,
            price_per_credit, total_value, status, created_at
     FROM   active_listings_view
     ORDER  BY created_at DESC`
  );
  return result.rows;
}

export async function getAllListings(filters?: { status?: string; seller_id?: number }) {
  let query = `
    SELECT ml.*, c.name AS seller_name, cc.credits_issued AS original_credits
    FROM   MarketListing ml
    JOIN   Company c       ON ml.seller_id  = c.company_id
    JOIN   CarbonCredit cc ON ml.credit_id  = cc.credit_id
    WHERE  1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.status) {
    query += ` AND ml.status = $${idx++}`;
    params.push(filters.status);
  }
  if (filters?.seller_id) {
    query += ` AND ml.seller_id = $${idx++}`;
    params.push(filters.seller_id);
  }

  query += ' ORDER BY ml.created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getListingById(listing_id: number) {
  const result = await pool.query(
    `SELECT ml.*, c.name AS seller_name, cc.credits_issued AS original_credits
     FROM   MarketListing ml
     JOIN   Company c       ON ml.seller_id  = c.company_id
     JOIN   CarbonCredit cc ON ml.credit_id  = cc.credit_id
     WHERE  ml.listing_id = $1`,
    [listing_id]
  );
  return result.rows[0] ?? null;
}

export async function createListing(seller_id: number, input: CreateListingInput) {
  // Verify the credit belongs to the seller and has enough unlisted quantity
  const creditCheck = await pool.query(
    `SELECT cc.credits_issued, cc.company_id,
            COALESCE(
              (SELECT SUM(ml.quantity)
               FROM MarketListing ml
               WHERE ml.credit_id = cc.credit_id
                 AND ml.status = 'Active'), 0
            ) AS active_quantity,
            COALESCE(
              (SELECT SUM(t.quantity)
               FROM Transaction t
               JOIN MarketListing ml ON t.listing_id = ml.listing_id
               WHERE ml.credit_id = cc.credit_id), 0
            ) AS sold_quantity
     FROM   CarbonCredit cc
     WHERE  cc.credit_id = $1`,
    [input.credit_id]
  );

  if (creditCheck.rowCount === 0) {
    throw { status: 404, message: 'Carbon credit not found', code: 'NOT_FOUND' };
  }

  const credit = creditCheck.rows[0];
  if (credit.company_id !== seller_id) {
    throw { status: 403, message: 'You can only list your own credits', code: 'FORBIDDEN' };
  }

  const activeQuantity = parseFloat(credit.active_quantity);
  const soldQuantity = parseFloat(credit.sold_quantity);
  const available = parseFloat(credit.credits_issued) - activeQuantity - soldQuantity;
  if (input.quantity > available) {
    throw {
      status: 400,
      message: `Only ${available} credits available for listing (${activeQuantity} active, ${soldQuantity} sold)`,
      code: 'INSUFFICIENT_QUANTITY',
    };
  }

  const result = await pool.query(
    `INSERT INTO MarketListing (seller_id, credit_id, quantity, price_per_credit)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [seller_id, input.credit_id, input.quantity, input.price_per_credit]
  );
  return result.rows[0];
}

export async function cancelListing(listing_id: number, seller_id: number) {
  const listing = await getListingById(listing_id);
  if (!listing) throw { status: 404, message: 'Listing not found', code: 'NOT_FOUND' };
  if (listing.seller_id !== seller_id) {
    throw { status: 403, message: 'You can only cancel your own listings', code: 'FORBIDDEN' };
  }
  if (listing.status !== 'Active') {
    throw { status: 400, message: 'Only Active listings can be cancelled', code: 'LISTING_NOT_ACTIVE' };
  }

  const result = await pool.query(
    `UPDATE MarketListing SET status = 'Cancelled' WHERE listing_id = $1 RETURNING *`,
    [listing_id]
  );
  return result.rows[0];
}

export async function adminCancelListing(listing_id: number) {
  const result = await pool.query(
    `UPDATE MarketListing SET status = 'Cancelled'
     WHERE listing_id = $1 AND status = 'Active'
     RETURNING *`,
    [listing_id]
  );
  if (result.rowCount === 0) {
    throw { status: 400, message: 'Listing not found or not Active', code: 'LISTING_NOT_ACTIVE' };
  }
  return result.rows[0];
}

export async function getActiveListingsCursor() {
  const result = await pool.query('SELECT * FROM get_active_listings_cursor()');
  return result.rows;
}
