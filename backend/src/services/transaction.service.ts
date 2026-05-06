import { pool } from '../config/db';
import { CreateTransactionInput } from '../validators/transaction.validator';

export async function getAllTransactions(filters?: { buyer_id?: number; seller_id?: number; participant_id?: number }) {
  let query = `
    SELECT t.*,
           buyer.name  AS buyer_name,
           seller.name AS seller_name,
           ml.seller_id,
           ml.price_per_credit,
           ml.credit_id,
           ml.status AS listing_status
    FROM   Transaction t
    JOIN   Company buyer  ON t.buyer_id    = buyer.company_id
    JOIN   MarketListing ml ON t.listing_id = ml.listing_id
    JOIN   Company seller ON ml.seller_id   = seller.company_id
    WHERE  1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.buyer_id) {
    query += ` AND t.buyer_id = $${idx++}`;
    params.push(filters.buyer_id);
  }
  if (filters?.seller_id) {
    query += ` AND ml.seller_id = $${idx++}`;
    params.push(filters.seller_id);
  }
  if (filters?.participant_id) {
    query += ` AND (t.buyer_id = $${idx} OR ml.seller_id = $${idx})`;
    params.push(filters.participant_id);
    idx++;
  }

  query += ' ORDER BY t.txn_date DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getTransactionById(txn_id: number) {
  const result = await pool.query(
    `SELECT t.*,
            buyer.name  AS buyer_name,
            seller.name AS seller_name,
            ml.seller_id, ml.price_per_credit, ml.credit_id, ml.status AS listing_status
     FROM   Transaction t
     JOIN   Company buyer  ON t.buyer_id    = buyer.company_id
     JOIN   MarketListing ml ON t.listing_id = ml.listing_id
     JOIN   Company seller ON ml.seller_id   = seller.company_id
     WHERE  t.txn_id = $1`,
    [txn_id]
  );
  return result.rows[0] ?? null;
}

export async function executePurchase(buyer_id: number, input: CreateTransactionInput) {
  // Calls the stored PROCEDURE which handles locking, validation, and wallet updates
  await pool.query(
    'CALL execute_credit_purchase($1, $2, $3)',
    [input.listing_id, buyer_id, input.quantity]
  );

  // Fetch the newly created transaction
  const result = await pool.query(
    `SELECT t.*,
            buyer.name  AS buyer_name,
            seller.name AS seller_name,
            ml.seller_id,
            ml.price_per_credit,
            ml.status AS listing_status
     FROM   Transaction t
     JOIN   Company buyer  ON t.buyer_id    = buyer.company_id
     JOIN   MarketListing ml ON t.listing_id = ml.listing_id
     JOIN   Company seller ON ml.seller_id   = seller.company_id
     WHERE  t.listing_id = $1 AND t.buyer_id = $2
     ORDER  BY t.txn_date DESC
     LIMIT  1`,
    [input.listing_id, buyer_id]
  );
  return result.rows[0];
}
