import { z } from "zod";

export const createActivitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: z.string().min(1, "Type is required"),
  date: z.coerce.date(),
  baseId: z.string().min(1).optional().nullable(),
  platoonId: z.string().min(1).optional().nullable(),
  squadIds: z.array(z.string()).optional().default([]),
  isCrossBase: z.boolean().optional().default(false),
});
