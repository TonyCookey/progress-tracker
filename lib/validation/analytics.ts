import { z } from "zod";
import { optionalDate } from "@/lib/validation/parse";

function startOfYear() {
  return new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
}

export const dateRangeSchema = z.object({
  baseId: z.string().optional().nullable(),
  from: optionalDate(),
  to: optionalDate(),
});

export function resolveDateRange(input: { from?: Date; to?: Date }) {
  return {
    from: input.from ?? startOfYear(),
    to: input.to ?? new Date(),
  };
}

export const offeringsQuerySchema = dateRangeSchema.extend({
  by: z.enum(["month", "service"]).optional(),
  groupByBase: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const attendanceQuerySchema = dateRangeSchema.extend({
  activityType: z.string().optional(),
});

export const dropoffQuerySchema = z.object({
  baseId: z.string().optional().nullable(),
  activityType: z.string().optional(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
});

export const groupsQuerySchema = dateRangeSchema;
