import { Request, Response } from 'express';
import * as CompanyService from '../services/company.service';
import { createCompanyWithUserSchema } from '../validators/company.validator';
import { mapDbError } from '../services/errors';

export async function listCompanies(req: Request, res: Response): Promise<void> {
  try {
    const companies = await CompanyService.getAllCompanies();
    res.json({ success: true, data: companies });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  try {
    const company = await CompanyService.getCompanyById(parseInt(req.params.id, 10));
    if (!company) { res.status(404).json({ success: false, error: 'Company not found' }); return; }
    res.json({ success: true, data: company });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}

export async function registerCompany(req: Request, res: Response): Promise<void> {
  const parse = createCompanyWithUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const result = await CompanyService.registerCompanyWithAdmin(parse.data);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const m = mapDbError(err);
    res.status(m.status).json({ success: false, error: m.message, code: m.code });
  }
}
