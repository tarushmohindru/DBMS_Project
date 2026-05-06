import { z } from 'zod';
export declare const generateReportSchema: z.ZodObject<{
    authority_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    authority_id: number;
}, {
    authority_id: number;
}>;
export declare const auditReportSchema: z.ZodObject<{
    status: z.ZodEnum<["Audited"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "Audited";
    notes?: string | undefined;
}, {
    status: "Audited";
    notes?: string | undefined;
}>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type AuditReportInput = z.infer<typeof auditReportSchema>;
//# sourceMappingURL=compliance.validator.d.ts.map