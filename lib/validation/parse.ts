import { ZodSchema } from "zod";
import { ApiError } from "@/lib/auth";

export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, "Invalid request body", result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}
