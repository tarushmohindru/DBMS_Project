import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(255),
});

export const registerUserSchema = z.object({
  username:     z.string().min(3).max(100),
  password:     z.string().min(8).max(255),
  role:         z.enum(['company_admin', 'regulatory_authority', 'marketplace_admin']),
  company_id:   z.number().int().positive().optional().nullable(),
  authority_id: z.number().int().positive().optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.role === 'company_admin' && (!value.company_id || value.authority_id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Company admin users require company_id and must not include authority_id',
      path: ['company_id'],
    });
  }
  if (value.role === 'regulatory_authority' && (!value.authority_id || value.company_id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Regulatory authority users require authority_id and must not include company_id',
      path: ['authority_id'],
    });
  }
  if (value.role === 'marketplace_admin' && (value.company_id || value.authority_id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Marketplace admin users must not include company_id or authority_id',
      path: ['role'],
    });
  }
});

export type LoginInput         = z.infer<typeof loginSchema>;
export type RegisterUserInput  = z.infer<typeof registerUserSchema>;
