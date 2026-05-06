import { z } from 'zod';

export const createTransactionSchema = z.object({
  listing_id: z.number().int().positive(),
  quantity:   z.number().positive('Quantity must be greater than 0'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
