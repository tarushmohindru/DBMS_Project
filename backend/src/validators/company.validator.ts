import { z } from 'zod';

export const createCompanySchema = z.object({
  name:            z.string().min(1).max(255),
  industry:        z.string().max(100).optional(),
  registration_no: z.string().min(1).max(100),
});

export const createCompanyWithUserSchema = z.object({
  company: z.object({
    name:            z.string().min(1).max(255),
    industry:        z.string().max(100).optional(),
    registration_no: z.string().min(1).max(100),
  }),
  user: z.object({
    username: z.string().min(3).max(100),
    password: z.string().min(8).max(255),
  }),
});

export type CreateCompanyInput         = z.infer<typeof createCompanySchema>;
export type CreateCompanyWithUserInput = z.infer<typeof createCompanyWithUserSchema>;
