import { pool } from '../config/db';
import { GenerateReportInput, AuditReportInput } from '../validators/compliance.validator';

export async function getAllReports(filters?: { company_id?: number; authority_id?: number; status?: string }) {
  let query = `
    SELECT cr.*, c.name AS company_name, ra.name AS authority_name
    FROM   ComplianceReport cr
    JOIN   Company c             ON cr.company_id   = c.company_id
    JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
    WHERE  1=1
  `;
  const params: unknown[] = [];
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
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getReportById(report_id: number) {
  const result = await pool.query(
    `SELECT cr.*, c.name AS company_name, ra.name AS authority_name
     FROM   ComplianceReport cr
     JOIN   Company c             ON cr.company_id   = c.company_id
     JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
     WHERE  cr.report_id = $1`,
    [report_id]
  );
  return result.rows[0] ?? null;
}

export async function generateReport(company_id: number, input: GenerateReportInput) {
  // Calls the stored PROCEDURE which uses cursors internally
  await pool.query(
    'CALL generate_compliance_report($1, $2)',
    [company_id, input.authority_id]
  );

  // Return the newly generated report
  const result = await pool.query(
    `SELECT cr.*, c.name AS company_name, ra.name AS authority_name
     FROM   ComplianceReport cr
     JOIN   Company c             ON cr.company_id   = c.company_id
     JOIN   RegulatoryAuthority ra ON cr.authority_id = ra.authority_id
     WHERE  cr.company_id = $1
     ORDER  BY cr.created_at DESC
     LIMIT  1`,
    [company_id]
  );
  return result.rows[0];
}

export async function auditReport(report_id: number, authority_id: number, _input: AuditReportInput) {
  const result = await pool.query(
    `UPDATE ComplianceReport SET status = 'Audited'
     WHERE  report_id = $1 AND authority_id = $2 AND status = 'Submitted'
     RETURNING *`,
    [report_id, authority_id]
  );
  if (result.rowCount === 0) {
    throw { status: 400, message: 'Report not found or not in Submitted status', code: 'INVALID_STATUS' };
  }
  return result.rows[0];
}

export async function getComplianceSummaryView() {
  const result = await pool.query('SELECT * FROM compliance_summary_view ORDER BY total_issued DESC');
  return result.rows;
}

export async function getPeriodicComplianceSummary(authority_id: number) {
  const result = await pool.query(
    'SELECT * FROM generate_periodic_compliance_summary($1)',
    [authority_id]
  );
  return result.rows;
}

export async function getAllAuthorities() {
  const result = await pool.query('SELECT * FROM RegulatoryAuthority ORDER BY name');
  return result.rows;
}
