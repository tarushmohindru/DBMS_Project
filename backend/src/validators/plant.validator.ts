import { z } from 'zod';

export const createPlantSchema = z.object({
  name:      z.string().min(1).max(255),
  type:      z.enum(['Solar', 'Wind', 'Hydro', 'Biomass']),
  capacity:  z.number().positive('Capacity must be positive'),
  location:  z.string().max(255).optional(),
});

export const verifyPlantSchema = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  remarks:  z.string().max(1000).optional(),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;
export type VerifyPlantInput = z.infer<typeof verifyPlantSchema>;
