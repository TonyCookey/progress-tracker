import { z } from "zod";

export const createBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  label: z.string().optional().nullable(),
});

export const updateBaseSchema = createBaseSchema;
