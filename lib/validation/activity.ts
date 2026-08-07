import { z } from "zod";
import { optionalId } from "./parse";

export const markParticipationSchema = z.object({
  teenId: z.string().min(1, "teenId is required"),
  attended: z.boolean(),
  notes: z.string().optional().nullable(),
});

export const markTeacherParticipationSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  attended: z.boolean(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createActivitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  type: z.string().min(1, "Type is required"),
  date: z.coerce.date(),
  baseId: z.string().min(1).optional().nullable(),
  platoonId: optionalId(),
  squadIds: z.array(z.string()).optional().default([]),
  isCrossBase: z.boolean().optional().default(false),
});
