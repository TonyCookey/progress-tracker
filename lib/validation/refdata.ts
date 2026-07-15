import { z } from "zod";

export const refDataCategorySchema = z.enum(["activity_type", "offering_type"]);

export const createRefDataSchema = z.object({
  category: refDataCategorySchema,
  key: z.string().min(1).optional(), // derived from label if omitted
  label: z.string().min(1, "Label is required"),
  sortOrder: z.coerce.number().int().optional(), // defaults to append-at-end if omitted, see POST handler
});

// `key` and `category` are immutable once created — never accepted on update.
export const updateRefDataSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  sortOrder: z.coerce.number().int().optional(),
  active: z.boolean().optional(),
});
