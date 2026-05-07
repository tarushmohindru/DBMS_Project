import { Request, Response } from 'express';
import * as AuthService from '../services/auth.service';
import { loginSchema, registerUserSchema } from '../validators/auth.validator';
import { mapDbError } from '../services/errors';

export async function login(req: Request, res: Response): Promise<void> {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const result = await AuthService.loginUser(parse.data);
    res.json({ success: true, data: result });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string; code?: string };
    if (e.status) {
      res.status(e.status).json({ success: false, error: e.message, code: e.code });
    } else {
      const mapped = mapDbError(err);
      res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
    }
  }
}

export async function registerUser(req: Request, res: Response): Promise<void> {
  const parse = registerUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const user = await AuthService.registerUser(parse.data);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    const mapped = mapDbError(err);
    res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
  }
}

export async function signupUser(req: Request, res: Response): Promise<void> {
  const parse = registerUserSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ success: false, error: parse.error.errors[0].message });
    return;
  }
  try {
    const user = await AuthService.registerUser(parse.data);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    const mapped = mapDbError(err);
    res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
  }
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await AuthService.listUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    const mapped = mapDbError(err);
    res.status(mapped.status).json({ success: false, error: mapped.message, code: mapped.code });
  }
}

export function getMe(req: Request, res: Response): void {
  res.json({ success: true, data: req.user });
}
