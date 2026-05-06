import { z } from 'zod';

export const createProductionLogSchema = z.object({
  plant_id:   z.number().int().positive(),
  log_date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  energy_kwh: z.number().positive('Energy must be greater than 0'),
});

export const verifyProductionLogSchema = z.object({
  decision: z.enum(['Verified', 'Rejected']),
  remarks:  z.string().max(1000).optional(),
});

export type CreateProductionLogInput = z.infer<typeof createProductionLogSchema>;
export type VerifyProductionLogInput = z.infer<typeof verifyProductionLogSchema>;
