import { z } from "zod";

export const createOfferingSchema = z.object({
  service: z.string().min(1, "Service is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.coerce.date(),
  notes: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
  baseId: z.string().min(1).nullable().optional(),
  isCrossBase: z.boolean().optional(),
});

export const updateOfferingSchema = createOfferingSchema;
