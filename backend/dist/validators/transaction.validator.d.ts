import { z } from 'zod';
export declare const createTransactionSchema: z.ZodObject<{
    listing_id: z.ZodNumber;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    listing_id: number;
}, {
    quantity: number;
    listing_id: number;
}>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
//# sourceMappingURL=transaction.validator.d.ts.map