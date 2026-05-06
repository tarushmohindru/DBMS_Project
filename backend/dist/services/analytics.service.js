"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopBuyers = getTopBuyers;
exports.getCreditIssuanceTrends = getCreditIssuanceTrends;
exports.getMarketplaceVolume = getMarketplaceVolume;
exports.getCompanyPerformance = getCompanyPerformance;
exports.getDashboardKPIs = getDashboardKPIs;
exports.getPublicSummary = getPublicSummary;
exports.getCompanyDashboardKPIs = getCompanyDashboardKPIs;
exports.getFullAnalytics = getFullAnalytics;
const db_1 = require("../config/db");
async function getTopBuyers() {
    const result = await db_1.pool.query('SELECT * FROM top_buyers_view LIMIT 10');
    return result.rows;
}
async function getCreditIssuanceTrends() {
    const result = await db_1.pool.query('SELECT * FROM credit_issuance_trends_view LIMIT 24');
    return result.rows;
}
async function getMarketplaceVolume() {
    const result = await db_1.pool.query('SELECT * FROM marketplace_volume_view LIMIT 24');
    return result.rows;
}
async function getCompanyPerformance() {
    const result = await db_1.pool.query('SELECT * FROM company_performance_view ORDER BY total_issued DESC');
    return result.rows;
}
async function getDashboardKPIs() {
    const [credits, listings, transactions, volume] = await Promise.all([
        db_1.pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(credits_issued), 0) AS total
                FROM CarbonCredit`),
        db_1.pool.query(`SELECT COUNT(*) AS count FROM MarketListing WHERE status = 'Active'`),
        db_1.pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
                FROM Transaction`),
        db_1.pool.query(`SELECT COALESCE(SUM(balance), 0) AS total FROM CreditWallet`),
    ]);
    return {
        total_credits_issued: parseFloat(credits.rows[0].total),
        credits_count: parseInt(credits.rows[0].count, 10),
        active_listings: parseInt(listings.rows[0].count, 10),
        total_transactions: parseInt(transactions.rows[0].count, 10),
        marketplace_volume: parseFloat(transactions.rows[0].total),
        total_wallet_balance: parseFloat(volume.rows[0].total),
    };
}
async function getPublicSummary() {
    const [credits, companies, transactions] = await Promise.all([
        db_1.pool.query('SELECT COALESCE(SUM(credits_issued), 0) AS total FROM CarbonCredit'),
        db_1.pool.query('SELECT COUNT(*) AS count FROM Company'),
        db_1.pool.query('SELECT COUNT(*) AS count FROM Transaction'),
    ]);
    return {
        credits_issued: parseFloat(credits.rows[0].total),
        companies: parseInt(companies.rows[0].count, 10),
        transactions: parseInt(transactions.rows[0].count, 10),
    };
}
async function getCompanyDashboardKPIs(company_id) {
    const [credits, wallet, listings, bought, sold] = await Promise.all([
        db_1.pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(credits_issued), 0) AS total
       FROM CarbonCredit WHERE company_id = $1`, [company_id]),
        db_1.pool.query(`SELECT COALESCE(balance, 0) AS balance FROM CreditWallet WHERE company_id = $1`, [company_id]),
        db_1.pool.query(`SELECT COUNT(*) AS count FROM MarketListing WHERE seller_id = $1 AND status = 'Active'`, [company_id]),
        db_1.pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS total
       FROM Transaction WHERE buyer_id = $1`, [company_id]),
        db_1.pool.query(`SELECT COUNT(*) AS count, COALESCE(SUM(t.quantity), 0) AS total
       FROM Transaction t JOIN MarketListing ml ON t.listing_id = ml.listing_id
       WHERE ml.seller_id = $1`, [company_id]),
    ]);
    return {
        credits_issued: parseFloat(credits.rows[0].total),
        credits_count: parseInt(credits.rows[0].count, 10),
        wallet_balance: parseFloat(wallet.rows[0]?.balance ?? '0'),
        active_listings: parseInt(listings.rows[0].count, 10),
        credits_bought: parseFloat(bought.rows[0].total),
        buy_count: parseInt(bought.rows[0].count, 10),
        credits_sold: parseFloat(sold.rows[0].total),
        sell_count: parseInt(sold.rows[0].count, 10),
    };
}
async function getFullAnalytics() {
    const [kpis, topBuyers, issuanceTrends, volume, performance, compliance] = await Promise.all([
        getDashboardKPIs(),
        getTopBuyers(),
        getCreditIssuanceTrends(),
        getMarketplaceVolume(),
        getCompanyPerformance(),
        db_1.pool.query('SELECT * FROM compliance_summary_view'),
    ]);
    return { kpis, topBuyers, issuanceTrends, volume, performance, compliance: compliance.rows };
}
//# sourceMappingURL=analytics.service.js.map