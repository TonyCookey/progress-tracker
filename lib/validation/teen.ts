import { z } from "zod";

const pastoralFields = {
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  dateJoined: z.coerce.date().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "LEFT"]).optional().default("ACTIVE"),
};

export const createTeenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.coerce.date(),
  baseId: z.string().min(1, "Base is required"),
  rank: z.enum(["LIEUTENANT", "CAPTAIN"]),
  groupId: z.string().min(1).optional().nullable(),
  squadIds: z.array(z.string()).optional(),
  ...pastoralFields,
});

export const updateTeenSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().min(1, "Gender is required"),
  rank: z.enum(["LIEUTENANT", "CAPTAIN"]),
  dateOfBirth: z.coerce.date(),
  baseId: z.string().min(1, "Base is required"),
  platoonId: z.string().min(1).optional().nullable(),
  squadIds: z.array(z.string()).optional().default([]),
  ...pastoralFields,
});
