import { z } from 'zod';

export const createListingSchema = z.object({
  credit_id:        z.number().int().positive(),
  quantity:         z.number().positive('Quantity must be greater than 0'),
  price_per_credit: z.number().positive('Price must be greater than 0'),
});

export const cancelListingSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CancelListingInput = z.infer<typeof cancelListingSchema>;
