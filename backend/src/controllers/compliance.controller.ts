import { Request, Response } from 'express';
import * as ComplianceService from '../services/compliance.service';
import { generateReportSchema, auditReportSchema } from '../validators/compliance.validator';
import { mapDbError } from '../services/errors';

export async function listReports(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query as { status?: string };
    const company_id   = req.user?.role === 'company_admin'         ? req.user.company_id   ?? undefined : undefined;
    const authority_id = req.user?.role === 'regulatory_authority'  ? req.user.authority_id ?? undefined : undefined;
    const reports = await ComplianceService.getAllReports({ company_id, authority_id, status });
    res.json({ success: true, data: reports });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getReport(req: Request, res: Response): Promise<void> {
  try {
    const report = await ComplianceService.getReportById(parseInt(req.params.id, 10));
    if (!report) { res.status(404).json({ success: false, error: 'Report not found' }); return; }
    if (req.user?.role === 'company_admin' && report.company_id !== req.user.company_id) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s compliance report' });
      return;
    }
    if (req.user?.role === 'regulatory_authority' && report.authority_id !== req.user.authority_id) {
      res.status(403).json({ success: false, error: 'Access denied to another authority\'s compliance report' });
      return;
    }
    res.json({ success: true, data: report });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function generateReport(req: Request, res: Response): Promise<void> {
  const parse = generateReportSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const company_id = req.user!.company_id!;
    const report = await ComplianceService.generateReport(company_id, parse.data);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function auditReport(req: Request, res: Response): Promise<void> {
  const parse = auditReportSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const report = await ComplianceService.auditReport(parseInt(req.params.id, 10), req.user!.authority_id!, parse.data);
    res.json({ success: true, data: report });
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) { res.status(e.status).json({ success: false, error: e.message, code: e.code }); return; }
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getComplianceSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await ComplianceService.getComplianceSummaryView();
    res.json({ success: true, data: summary });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getPeriodicSummary(req: Request, res: Response): Promise<void> {
  try {
    const authority_id = parseInt(req.params.authority_id, 10);
    if (req.user?.role === 'regulatory_authority' && authority_id !== req.user.authority_id) {
      res.status(403).json({ success: false, error: 'Access denied to another authority\'s summary' });
      return;
    }
    const data = await ComplianceService.getPeriodicComplianceSummary(authority_id);
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function listAuthorities(req: Request, res: Response): Promise<void> {
  try {
    const authorities = await ComplianceService.getAllAuthorities();
    res.json({ success: true, data: authorities });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
