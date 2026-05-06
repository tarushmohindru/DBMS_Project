"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallet = getWallet;
exports.getWalletBalance = getWalletBalance;
exports.getWalletHistory = getWalletHistory;
const db_1 = require("../config/db");
async function getWallet(company_id) {
    const result = await db_1.pool.query(`SELECT cw.*, c.name AS company_name
     FROM   CreditWallet cw
     JOIN   Company c ON cw.company_id = c.company_id
     WHERE  cw.company_id = $1`, [company_id]);
    if (result.rowCount === 0) {
        throw { status: 404, message: 'Wallet not found for this company', code: 'WALLET_NOT_FOUND' };
    }
    return result.rows[0];
}
async function getWalletBalance(company_id) {
    const result = await db_1.pool.query('SELECT get_company_wallet_balance($1) AS balance', [company_id]);
    return parseFloat(result.rows[0].balance);
}
async function getWalletHistory(company_id) {
    const credits = await db_1.pool.query(`SELECT 'CREDIT_ISSUED' AS type, cc.issued_date AS date,
            cc.credits_issued AS amount, pl.log_date,
            ep.name AS plant_name,
            NULL::NUMERIC AS monetary_amount
     FROM   CarbonCredit cc
     JOIN   ProductionLog pl ON cc.log_id   = pl.log_id
     JOIN   EnergyPlant ep   ON pl.plant_id  = ep.plant_id
     WHERE  cc.company_id = $1`, [company_id]);
    const bought = await db_1.pool.query(`SELECT 'PURCHASE' AS type, t.txn_date AS date,
            t.quantity AS amount, t.quantity,
            c.name AS counterparty,
            t.total_amount AS monetary_amount
     FROM   Transaction t
     JOIN   MarketListing ml ON t.listing_id = ml.listing_id
     JOIN   Company c        ON ml.seller_id  = c.company_id
     WHERE  t.buyer_id = $1`, [company_id]);
    const sold = await db_1.pool.query(`SELECT 'SALE' AS type, t.txn_date AS date,
            -t.quantity AS amount, t.quantity,
            c.name AS counterparty,
            t.total_amount AS monetary_amount
     FROM   Transaction t
     JOIN   MarketListing ml ON t.listing_id = ml.listing_id
     JOIN   Company c        ON t.buyer_id    = c.company_id
     WHERE  ml.seller_id = $1`, [company_id]);
    const all = [
        ...credits.rows,
        ...bought.rows,
        ...sold.rows,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return all;
}
//# sourceMappingURL=wallet.service.js.map