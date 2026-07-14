import { z, ZodTypeAny } from "zod";
import { ApiError } from "@/lib/auth";

// `S extends ZodTypeAny` + `z.infer<S>` (rather than the old `ZodSchema<T>` alias, which
// pins Input === Output) so schemas with an asymmetric Input/Output - like fields built
// with z.preprocess()/optionalDate() - still infer their real Output type instead of
// collapsing to `unknown`.
export function parseOrThrow<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, "Invalid request body", result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}

// Optional date field from a form: treats "" (an untouched <input type="date">) the same
// as an omitted field instead of letting z.coerce.date() reject it as an invalid date.
export function optionalDate() {
  return z.preprocess((val) => (val === "" || val === null ? undefined : val), z.coerce.date().optional());
}
