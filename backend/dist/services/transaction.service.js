"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTransactions = getAllTransactions;
exports.getTransactionById = getTransactionById;
exports.executePurchase = executePurchase;
const db_1 = require("../config/db");
async function getAllTransactions(filters) {
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
    const params = [];
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
    const result = await db_1.pool.query(query, params);
    return result.rows;
}
async function getTransactionById(txn_id) {
    const result = await db_1.pool.query(`SELECT t.*,
            buyer.name  AS buyer_name,
            seller.name AS seller_name,
            ml.seller_id, ml.price_per_credit, ml.credit_id, ml.status AS listing_status
     FROM   Transaction t
     JOIN   Company buyer  ON t.buyer_id    = buyer.company_id
     JOIN   MarketListing ml ON t.listing_id = ml.listing_id
     JOIN   Company seller ON ml.seller_id   = seller.company_id
     WHERE  t.txn_id = $1`, [txn_id]);
    return result.rows[0] ?? null;
}
async function executePurchase(buyer_id, input) {
    // Calls the stored PROCEDURE which handles locking, validation, and wallet updates
    await db_1.pool.query('CALL execute_credit_purchase($1, $2, $3)', [input.listing_id, buyer_id, input.quantity]);
    // Fetch the newly created transaction
    const result = await db_1.pool.query(`SELECT t.*,
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
     LIMIT  1`, [input.listing_id, buyer_id]);
    return result.rows[0];
}
//# sourceMappingURL=transaction.service.js.map