import { z } from 'zod';
export declare const createListingSchema: z.ZodObject<{
    credit_id: z.ZodNumber;
    quantity: z.ZodNumber;
    price_per_credit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    credit_id: number;
    quantity: number;
    price_per_credit: number;
}, {
    credit_id: number;
    quantity: number;
    price_per_credit: number;
}>;
export declare const cancelListingSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CancelListingInput = z.infer<typeof cancelListingSchema>;
//# sourceMappingURL=listing.validator.d.ts.map