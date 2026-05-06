import { Request, Response } from 'express';
import * as TxnService from '../services/transaction.service';
import { createTransactionSchema } from '../validators/transaction.validator';
import { mapDbError } from '../services/errors';

export async function listTransactions(req: Request, res: Response): Promise<void> {
  try {
    const filters: { buyer_id?: number; seller_id?: number; participant_id?: number } = {};
    if (req.user?.role === 'company_admin') {
      // Company sees their own buys and sells
      filters.participant_id = req.user.company_id ?? undefined;
    }
    const txns = await TxnService.getAllTransactions(filters);
    res.json({ success: true, data: txns });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  try {
    const txn = await TxnService.getTransactionById(parseInt(req.params.id, 10));
    if (!txn) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
    if (
      req.user?.role === 'company_admin' &&
      txn.buyer_id !== req.user.company_id &&
      txn.seller_id !== req.user.company_id
    ) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s transaction' });
      return;
    }
    res.json({ success: true, data: txn });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function executePurchase(req: Request, res: Response): Promise<void> {
  const parse = createTransactionSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const buyer_id = req.user!.company_id!;
    const txn = await TxnService.executePurchase(buyer_id, parse.data);
    res.status(201).json({ success: true, data: txn });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
