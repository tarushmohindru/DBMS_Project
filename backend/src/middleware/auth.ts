import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  user_id:      number;
  username:     string;
  role:         'company_admin' | 'regulatory_authority' | 'marketplace_admin';
  company_id?:  number | null;
  authority_id?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or malformed authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ success: false, error: 'JWT secret is not configured', code: 'AUTH_CONFIG_ERROR' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authorize(...roles: AuthPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: `Access denied. Required role(s): ${roles.join(', ')}` });
      return;
    }
    next();
  };
}

// Ensures company_admin can only access their own company's data
export function ownCompanyOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthenticated' });
    return;
  }
  if (req.user.role === 'marketplace_admin' || req.user.role === 'regulatory_authority') {
    next();
    return;
  }
  const paramCompanyId = parseInt(req.params.company_id || req.params.id || '0', 10);
  if (req.user.company_id !== paramCompanyId) {
    res.status(403).json({ success: false, error: 'Access denied to another company\'s data' });
    return;
  }
  next();
}
