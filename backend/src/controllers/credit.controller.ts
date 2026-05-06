import { Request, Response } from 'express';
import * as CreditService from '../services/credit.service';
import { mapDbError } from '../services/errors';

export async function listCredits(req: Request, res: Response): Promise<void> {
  try {
    const { from, to } = req.query as Record<string, string>;
    const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
    const credits = await CreditService.getAllCredits({ company_id, from, to });
    res.json({ success: true, data: credits });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCredit(req: Request, res: Response): Promise<void> {
  try {
    const credit = await CreditService.getCreditById(parseInt(req.params.id, 10));
    if (!credit) { res.status(404).json({ success: false, error: 'Carbon credit not found' }); return; }
    if (req.user?.role === 'company_admin' && credit.company_id !== req.user.company_id) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s carbon credit' });
      return;
    }
    res.json({ success: true, data: credit });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCreditsByCompany(req: Request, res: Response): Promise<void> {
  try {
    const company_id = parseInt(req.params.id, 10);
    if (req.user?.role === 'company_admin' && company_id !== req.user.company_id) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s carbon credits' });
      return;
    }
    const credits = await CreditService.getCreditsByCompany(company_id);
    res.json({ success: true, data: credits });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCreditSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await CreditService.getCreditSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
