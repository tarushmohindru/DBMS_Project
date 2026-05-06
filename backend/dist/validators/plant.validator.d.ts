import { z } from 'zod';
export declare const createPlantSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["Solar", "Wind", "Hydro", "Biomass"]>;
    capacity: z.ZodNumber;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "Solar" | "Wind" | "Hydro" | "Biomass";
    name: string;
    capacity: number;
    location?: string | undefined;
}, {
    type: "Solar" | "Wind" | "Hydro" | "Biomass";
    name: string;
    capacity: number;
    location?: string | undefined;
}>;
export declare const verifyPlantSchema: z.ZodObject<{
    decision: z.ZodEnum<["Approved", "Rejected"]>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "Approved" | "Rejected";
    remarks?: string | undefined;
}, {
    decision: "Approved" | "Rejected";
    remarks?: string | undefined;
}>;
export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type VerifyPlantInput = z.infer<typeof verifyPlantSchema>;
//# sourceMappingURL=plant.validator.d.ts.map