import { z } from 'zod';

export const generateReportSchema = z.object({
  authority_id: z.number().int().positive(),
});

export const auditReportSchema = z.object({
  status: z.enum(['Audited']),
  notes:  z.string().max(1000).optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type AuditReportInput    = z.infer<typeof auditReportSchema>;
