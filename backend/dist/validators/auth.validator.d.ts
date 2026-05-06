import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const registerUserSchema: z.ZodEffects<z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["company_admin", "regulatory_authority", "marketplace_admin"]>;
    company_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    authority_id: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    role: "company_admin" | "regulatory_authority" | "marketplace_admin";
    company_id?: number | null | undefined;
    authority_id?: number | null | undefined;
}, {
    username: string;
    password: string;
    role: "company_admin" | "regulatory_authority" | "marketplace_admin";
    company_id?: number | null | undefined;
    authority_id?: number | null | undefined;
}>, {
    username: string;
    password: string;
    role: "company_admin" | "regulatory_authority" | "marketplace_admin";
    company_id?: number | null | undefined;
    authority_id?: number | null | undefined;
}, {
    username: string;
    password: string;
    role: "company_admin" | "regulatory_authority" | "marketplace_admin";
    company_id?: number | null | undefined;
    authority_id?: number | null | undefined;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
//# sourceMappingURL=auth.validator.d.ts.map