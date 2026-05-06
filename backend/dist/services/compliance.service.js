"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReports = getAllReports;
exports.getReportById = getReportById;
exports.generateReport = generateReport;
exports.auditReport = auditReport;
exports.getComplianceSummaryView = getComplianceSummaryView;
exports.getPeriodicComplianceSummary = getPeriodicComplianceSummary;
exports.getAllAuthorities = getAllAuthorities;
const db_1 = require("../config/db");
async function getAllReports(filters) {
    let query = `
    SELECT cr.*, c.name AS company_name, ra.name AS authority_name
    FROM   ComplianceReport cr
    JOIN   Company c             ON cr.company_id   = c.company_id
    JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
    WHERE  1=1
  `;
    const params = [];
    let idx = 1;
    if (filters?.company_id) {
        query += ` AND cr.company_id = $${idx++}`;
        params.push(filters.company_id);
    }
    if (filters?.authority_id) {
        query += ` AND cr.authority_id = $${idx++}`;
        params.push(filters.authority_id);
    }
    if (filters?.status) {
        query += ` AND cr.status = $${idx++}`;
        params.push(filters.status);
    }
    query += ' ORDER BY cr.created_at DESC';
    const result = await db_1.pool.query(query, params);
    return result.rows;
}
async function getReportById(report_id) {
    const result = await db_1.pool.query(`SELECT cr.*, c.name AS company_name, ra.name AS authority_name
     FROM   ComplianceReport cr
     JOIN   Company c             ON cr.company_id   = c.company_id
     JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
     WHERE  cr.report_id = $1`, [report_id]);
    return result.rows[0] ?? null;
}
async function generateReport(company_id, input) {
    // Calls the stored PROCEDURE which uses cursors internally
    await db_1.pool.query('CALL generate_compliance_report($1, $2)', [company_id, input.authority_id]);
    // Return the newly generated report
    const result = await db_1.pool.query(`SELECT cr.*, c.name AS company_name, ra.name AS authority_name
     FROM   ComplianceReport cr
     JOIN   Company c             ON cr.company_id   = c.company_id
     JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
     WHERE  cr.company_id = $1
     ORDER  BY cr.created_at DESC
     LIMIT  1`, [company_id]);
    return result.rows[0];
}
async function auditReport(report_id, authority_id, _input) {
    const result = await db_1.pool.query(`UPDATE ComplianceReport SET status = 'Audited'
     WHERE  report_id = $1 AND authority_id = $2 AND status = 'Submitted'
     RETURNING *`, [report_id, authority_id]);
    if (result.rowCount === 0) {
        throw { status: 400, message: 'Report not found or not in Submitted status', code: 'INVALID_STATUS' };
    }
    return result.rows[0];
}
async function getComplianceSummaryView() {
    const result = await db_1.pool.query('SELECT * FROM compliance_summary_view ORDER BY total_issued DESC');
    return result.rows;
}
async function getPeriodicComplianceSummary(authority_id) {
    const result = await db_1.pool.query('SELECT * FROM generate_periodic_compliance_summary($1)', [authority_id]);
    return result.rows;
}
async function getAllAuthorities() {
    const result = await db_1.pool.query('SELECT * FROM RegulatoryAuthority ORDER BY name');
    return result.rows;
}
//# sourceMappingURL=compliance.service.js.map