import { z } from "zod";

export const createTeenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.coerce.date(),
  baseId: z.string().min(1, "Base is required"),
  rank: z.enum(["LIEUTENANT", "CAPTAIN"]),
  groupId: z.string().min(1).optional().nullable(),
  squadIds: z.array(z.string()).optional(),
});

export const updateTeenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  rank: z.enum(["LIEUTENANT", "CAPTAIN"]),
  dateOfBirth: z.coerce.date(),
  baseId: z.string().min(1, "Base is required"),
  platoonId: z.string().min(1).optional().nullable(),
  squadIds: z.array(z.string()).optional().default([]),
});
