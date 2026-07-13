import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  baseId: z.string().min(1, "Base is required"),
  type: z.enum(["PLATOON", "SQUAD"]),
  leaderId: z.string().min(1, "Leader is required"),
});
