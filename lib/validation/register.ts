import { z } from "zod";
import { optionalDate } from "./parse";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  dateOfBirth: optionalDate(),
  anniversaryDate: optionalDate(),
  gender: z.string().optional().nullable(),
  role: z.enum(["SUPERADMIN", "GENERAL", "COLONEL", "VOLUNTEER"]),
  baseName: z.string().min(1, "Base is required"),
});
