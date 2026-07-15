import { z } from "zod";

const householdBaseFields = {
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  primaryContactName: z.string().optional().nullable(),
  primaryContactPhone: z.string().optional().nullable(),
  baseId: z.string().min(1).optional().nullable(),
};

export const createHouseholdSchema = z.object(householdBaseFields);

export const updateHouseholdSchema = z.object(householdBaseFields);
