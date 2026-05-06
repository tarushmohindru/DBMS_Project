import { Request, Response } from 'express';
import * as LogService from '../services/productionLog.service';
import { createProductionLogSchema, verifyProductionLogSchema } from '../validators/productionLog.validator';
import { mapDbError } from '../services/errors';

export async function listLogs(req: Request, res: Response): Promise<void> {
  try {
    const { verification_status, plant_id } = req.query as Record<string, string>;
    const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
    const logs = await LogService.getAllLogs({
      verification_status,
      company_id,
      plant_id: plant_id ? parseInt(plant_id, 10) : undefined,
    });
    res.json({ success: true, data: logs });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await LogService.getLogById(parseInt(req.params.id, 10));
    if (!log) { res.status(404).json({ success: false, error: 'Production log not found' }); return; }
    if (req.user?.role === 'company_admin' && log.company_id !== req.user.company_id) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s production log' });
      return;
    }
    res.json({ success: true, data: log });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function createLog(req: Request, res: Response): Promise<void> {
  const parse = createProductionLogSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const log = await LogService.createLog(req.user!.company_id!, parse.data);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) { res.status(e.status).json({ success: false, error: e.message, code: e.code }); return; }
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function verifyLog(req: Request, res: Response): Promise<void> {
  const parse = verifyProductionLogSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const authority_id = req.user!.authority_id!;
    const log = await LogService.verifyLog(parseInt(req.params.id, 10), authority_id, parse.data);
    res.json({ success: true, data: log });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
