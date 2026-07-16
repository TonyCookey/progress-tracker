import { z } from "zod";

export const refDataCategorySchema = z.enum(["activity_type", "offering_type"]);

// A blank/cleared numeric input serializes as JSON `null`, which `z.coerce.number()`
// would otherwise happily turn into 0 (`Number(null) === 0`). Treat null the same
// as "not provided" so it's rejected or left as append-at-end, never silently 0.
const optionalSortOrder = z.preprocess(
  (val) => (val === null ? undefined : val),
  z.coerce.number().int().optional(),
);

export const createRefDataSchema = z.object({
  category: refDataCategorySchema,
  key: z.string().min(1).optional(), // derived from label if omitted
  label: z.string().min(1, "Label is required"),
  sortOrder: optionalSortOrder, // defaults to append-at-end if omitted, see POST handler
});

// `key` and `category` are immutable once created — never accepted on update.
export const updateRefDataSchema = z.object({
  label: z.string().min(1, "Label is required").optional(),
  sortOrder: optionalSortOrder,
  active: z.boolean().optional(),
});
