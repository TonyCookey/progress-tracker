import { z } from "zod";
import { optionalDate } from "./parse";

export const graduateTeensSchema = z.object({
  teenIds: z.array(z.string().min(1)).min(1, "Pick at least one teen").max(500),
  graduatedAt: optionalDate(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const undoGraduationSchema = z.object({
  teenIds: z.array(z.string().min(1)).min(1).max(500),
});
