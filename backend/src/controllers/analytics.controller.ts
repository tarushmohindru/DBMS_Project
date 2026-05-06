import { Request, Response } from 'express';
import * as AnalyticsService from '../services/analytics.service';
import { mapDbError } from '../services/errors';

export async function getDashboardKPIs(req: Request, res: Response): Promise<void> {
  try {
    if (req.user?.role === 'company_admin' && req.user.company_id) {
      const kpis = await AnalyticsService.getCompanyDashboardKPIs(req.user.company_id);
      res.json({ success: true, data: kpis });
    } else {
      const kpis = await AnalyticsService.getDashboardKPIs();
      res.json({ success: true, data: kpis });
    }
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getPublicSummary(_req: Request, res: Response): Promise<void> {
  try {
    const summary = await AnalyticsService.getPublicSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getTopBuyers(req: Request, res: Response): Promise<void> {
  try {
    const data = await AnalyticsService.getTopBuyers();
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCreditIssuanceTrends(req: Request, res: Response): Promise<void> {
  try {
    const data = await AnalyticsService.getCreditIssuanceTrends();
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getMarketplaceVolume(req: Request, res: Response): Promise<void> {
  try {
    const data = await AnalyticsService.getMarketplaceVolume();
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCompanyPerformance(req: Request, res: Response): Promise<void> {
  try {
    const data = await AnalyticsService.getCompanyPerformance();
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getFullAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const data = await AnalyticsService.getFullAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
