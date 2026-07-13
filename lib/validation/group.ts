import { z } from "zod";

const groupBaseFields = {
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  baseId: z.string().min(1, "Base is required"),
  type: z.enum(["PLATOON", "SQUAD"]),
  leaderId: z.string().min(1, "Leader is required"),
  supportIds: z.array(z.string()).optional().default([]),
};

export const createGroupSchema = z.object(groupBaseFields);

export const updateGroupSchema = z.object(groupBaseFields);
