"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLogs = getAllLogs;
exports.getLogById = getLogById;
exports.createLog = createLog;
exports.verifyLog = verifyLog;
const db_1 = require("../config/db");
async function getAllLogs(filters) {
    let query = `
    SELECT pl.*, ep.name AS plant_name, ep.type AS plant_type,
           c.name AS company_name, c.company_id
    FROM   ProductionLog pl
    JOIN   EnergyPlant ep ON pl.plant_id = ep.plant_id
    JOIN   Company c      ON ep.company_id = c.company_id
    WHERE  1=1
  `;
    const params = [];
    let idx = 1;
    if (filters?.verification_status) {
        query += ` AND pl.verification_status = $${idx++}`;
        params.push(filters.verification_status);
    }
    if (filters?.company_id) {
        query += ` AND c.company_id = $${idx++}`;
        params.push(filters.company_id);
    }
    if (filters?.plant_id) {
        query += ` AND pl.plant_id = $${idx++}`;
        params.push(filters.plant_id);
    }
    query += ' ORDER BY pl.submitted_at DESC';
    const result = await db_1.pool.query(query, params);
    return result.rows;
}
async function getLogById(log_id) {
    const result = await db_1.pool.query(`SELECT pl.*, ep.name AS plant_name, ep.type AS plant_type,
            c.name AS company_name, c.company_id
     FROM   ProductionLog pl
     JOIN   EnergyPlant ep ON pl.plant_id = ep.plant_id
     JOIN   Company c      ON ep.company_id = c.company_id
     WHERE  pl.log_id = $1`, [log_id]);
    return result.rows[0] ?? null;
}
async function createLog(company_id, input) {
    // Verify the plant exists and is Approved before accepting a log
    const plantCheck = await db_1.pool.query(`SELECT status, company_id FROM EnergyPlant WHERE plant_id = $1`, [input.plant_id]);
    if (plantCheck.rowCount === 0) {
        throw { status: 404, message: 'Energy plant not found', code: 'NOT_FOUND' };
    }
    if (plantCheck.rows[0].status !== 'Approved') {
        throw { status: 400, message: 'Cannot submit log for a non-Approved plant', code: 'PLANT_NOT_APPROVED' };
    }
    if (plantCheck.rows[0].company_id !== company_id) {
        throw { status: 403, message: 'You can only submit logs for your own plants', code: 'FORBIDDEN' };
    }
    const duplicateCheck = await db_1.pool.query(`SELECT log_id FROM ProductionLog
     WHERE plant_id = $1 AND log_date = $2`, [input.plant_id, input.log_date]);
    if ((duplicateCheck.rowCount ?? 0) > 0) {
        throw { status: 409, message: 'A production log already exists for this plant and date', code: 'DUPLICATE_PRODUCTION_LOG' };
    }
    const result = await db_1.pool.query(`INSERT INTO ProductionLog (plant_id, log_date, energy_kwh)
     VALUES ($1, $2, $3)
     RETURNING *`, [input.plant_id, input.log_date, input.energy_kwh]);
    return result.rows[0];
}
// Calls the verify_production_log stored procedure
async function verifyLog(log_id, authority_id, input) {
    // PROCEDURE manages its own transaction internally
    await db_1.pool.query('CALL verify_production_log($1, $2, $3, $4)', [log_id, authority_id, input.decision, input.remarks ?? null]);
    return getLogById(log_id);
}
//# sourceMappingURL=productionLog.service.js.map