import { Request, Response } from 'express';
import * as WalletService from '../services/wallet.service';
import { mapDbError } from '../services/errors';

export async function getWallet(req: Request, res: Response): Promise<void> {
  try {
    const company_id = parseInt(req.params.company_id, 10);
    const wallet = await WalletService.getWallet(company_id);
    res.json({ success: true, data: wallet });
  } catch (err) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) { res.status(e.status).json({ success: false, error: e.message, code: e.code }); return; }
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getWalletHistory(req: Request, res: Response): Promise<void> {
  try {
    const company_id = parseInt(req.params.company_id, 10);
    const history = await WalletService.getWalletHistory(company_id);
    res.json({ success: true, data: history });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
