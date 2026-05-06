import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    user_id: number;
    username: string;
    role: 'company_admin' | 'regulatory_authority' | 'marketplace_admin';
    company_id?: number | null;
    authority_id?: number | null;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function authorize(...roles: AuthPayload['role'][]): (req: Request, res: Response, next: NextFunction) => void;
export declare function ownCompanyOnly(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map