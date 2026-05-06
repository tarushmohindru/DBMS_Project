"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCredits = getAllCredits;
exports.getCreditById = getCreditById;
exports.getCreditsByCompany = getCreditsByCompany;
exports.getCreditSummary = getCreditSummary;
const db_1 = require("../config/db");
async function getAllCredits(filters) {
    let query = `
    SELECT cc.*, c.name AS company_name, pl.log_date, pl.energy_kwh,
           ep.name AS plant_name, ep.type AS plant_type
    FROM   CarbonCredit cc
    JOIN   Company c      ON cc.company_id = c.company_id
    JOIN   ProductionLog pl ON cc.log_id   = pl.log_id
    JOIN   EnergyPlant ep   ON pl.plant_id  = ep.plant_id
    WHERE  1=1
  `;
    const params = [];
    let idx = 1;
    if (filters?.company_id) {
        query += ` AND cc.company_id = $${idx++}`;
        params.push(filters.company_id);
    }
    if (filters?.from) {
        query += ` AND cc.issued_date >= $${idx++}`;
        params.push(filters.from);
    }
    if (filters?.to) {
        query += ` AND cc.issued_date <= $${idx++}`;
        params.push(filters.to);
    }
    query += ' ORDER BY cc.issued_date DESC';
    const result = await db_1.pool.query(query, params);
    return result.rows;
}
async function getCreditById(credit_id) {
    const result = await db_1.pool.query(`SELECT cc.*, c.name AS company_name, pl.log_date, pl.energy_kwh,
            ep.name AS plant_name, ep.type AS plant_type
     FROM   CarbonCredit cc
     JOIN   Company c      ON cc.company_id = c.company_id
     JOIN   ProductionLog pl ON cc.log_id   = pl.log_id
     JOIN   EnergyPlant ep   ON pl.plant_id  = ep.plant_id
     WHERE  cc.credit_id = $1`, [credit_id]);
    return result.rows[0] ?? null;
}
async function getCreditsByCompany(company_id) {
    return getAllCredits({ company_id });
}
async function getCreditSummary() {
    const result = await db_1.pool.query(`SELECT c.company_id, c.name AS company_name, c.industry,
            COUNT(cc.credit_id)           AS credits_count,
            COALESCE(SUM(cc.credits_issued), 0) AS total_credits_issued,
            MIN(cc.issued_date)           AS first_issued,
            MAX(cc.issued_date)           AS last_issued
     FROM   Company c
     LEFT JOIN CarbonCredit cc ON c.company_id = cc.company_id
     GROUP  BY c.company_id, c.name, c.industry
     ORDER  BY total_credits_issued DESC`);
    return result.rows;
}
//# sourceMappingURL=credit.service.js.map