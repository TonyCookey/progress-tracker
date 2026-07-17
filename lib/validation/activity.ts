import { z } from "zod";

export const markParticipationSchema = z.object({
  teenId: z.string().min(1, "teenId is required"),
  attended: z.boolean(),
  notes: z.string().optional().nullable(),
});

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
