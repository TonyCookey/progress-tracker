import { z } from "zod";
import { optionalDate } from "./parse";

export const updateGeneralSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  dateOfBirth: optionalDate(),
  gender: z.string().optional().nullable(),
  role: z.enum(["SUPERADMIN", "GENERAL", "COLONEL", "VOLUNTEER"]),
  baseId: z.string().min(1, "Base is required"),
});

export const toggleActiveSchema = z.object({
  active: z.boolean(),
});
