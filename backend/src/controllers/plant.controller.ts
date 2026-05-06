import { Request, Response } from 'express';
import * as PlantService from '../services/plant.service';
import { createPlantSchema, verifyPlantSchema } from '../validators/plant.validator';
import { mapDbError } from '../services/errors';

export async function listPlants(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query as { status?: string };
    const company_id = req.user?.role === 'company_admin' ? req.user.company_id ?? undefined : undefined;
    const plants = await PlantService.getAllPlants({ status, company_id });
    res.json({ success: true, data: plants });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getPlant(req: Request, res: Response): Promise<void> {
  try {
    const plant = await PlantService.getPlantById(parseInt(req.params.id, 10));
    if (!plant) { res.status(404).json({ success: false, error: 'Plant not found' }); return; }
    if (req.user?.role === 'company_admin' && plant.company_id !== req.user.company_id) {
      res.status(403).json({ success: false, error: 'Access denied to another company\'s plant' });
      return;
    }
    res.json({ success: true, data: plant });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function createPlant(req: Request, res: Response): Promise<void> {
  const parse = createPlantSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const company_id = req.user!.company_id!;
    const plant = await PlantService.createPlant(company_id, parse.data);
    res.status(201).json({ success: true, data: plant });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function verifyPlant(req: Request, res: Response): Promise<void> {
  const parse = verifyPlantSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const authority_id = req.user!.authority_id!;
    const plant = await PlantService.verifyPlant(parseInt(req.params.id, 10), authority_id, parse.data);
    res.json({ success: true, data: plant });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getPlantAuditLog(req: Request, res: Response): Promise<void> {
  try {
    const log = await PlantService.getPlantVerificationLog(parseInt(req.params.id, 10));
    res.json({ success: true, data: log });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
