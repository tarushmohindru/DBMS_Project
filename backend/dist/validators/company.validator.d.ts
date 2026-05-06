import { z } from 'zod';
export declare const createCompanySchema: z.ZodObject<{
    name: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    registration_no: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    registration_no: string;
    industry?: string | undefined;
}, {
    name: string;
    registration_no: string;
    industry?: string | undefined;
}>;
export declare const createCompanyWithUserSchema: z.ZodObject<{
    company: z.ZodObject<{
        name: z.ZodString;
        industry: z.ZodOptional<z.ZodString>;
        registration_no: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        registration_no: string;
        industry?: string | undefined;
    }, {
        name: string;
        registration_no: string;
        industry?: string | undefined;
    }>;
    user: z.ZodObject<{
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        username: string;
        password: string;
    }, {
        username: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    company: {
        name: string;
        registration_no: string;
        industry?: string | undefined;
    };
    user: {
        username: string;
        password: string;
    };
}, {
    company: {
        name: string;
        registration_no: string;
        industry?: string | undefined;
    };
    user: {
        username: string;
        password: string;
    };
}>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateCompanyWithUserInput = z.infer<typeof createCompanyWithUserSchema>;
//# sourceMappingURL=company.validator.d.ts.map