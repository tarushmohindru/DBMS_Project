import { z } from 'zod';
export declare const createProductionLogSchema: z.ZodObject<{
    plant_id: z.ZodNumber;
    log_date: z.ZodString;
    energy_kwh: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    plant_id: number;
    log_date: string;
    energy_kwh: number;
}, {
    plant_id: number;
    log_date: string;
    energy_kwh: number;
}>;
export declare const verifyProductionLogSchema: z.ZodObject<{
    decision: z.ZodEnum<["Verified", "Rejected"]>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "Rejected" | "Verified";
    remarks?: string | undefined;
}, {
    decision: "Rejected" | "Verified";
    remarks?: string | undefined;
}>;
export type CreateProductionLogInput = z.infer<typeof createProductionLogSchema>;
export type VerifyProductionLogInput = z.infer<typeof verifyProductionLogSchema>;
//# sourceMappingURL=productionLog.validator.d.ts.map