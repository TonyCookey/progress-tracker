import { z } from "zod";
import { optionalDate } from "@/lib/validation/parse";

function startOfYear() {
  return new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
}

// Comma-separated id list from a query string ("a,b,c") -> string[]; "" / missing -> [].
const idList = () =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

export const dateRangeSchema = z.object({
  baseId: z.string().optional().nullable(),
  from: optionalDate(),
  to: optionalDate(),
  platoonIds: idList(),
  squadIds: idList(),
});

const DAY_MS = 24 * 60 * 60 * 1000;

// The filter bar's "to" is an inclusive calendar date (e.g. 2026-11-16 means "up to and
// including the 16th"), but every query uses `lt: to`. Push a supplied date to the start
// of the following day so activities/offerings on the end date itself are counted -
// previously "This Month" silently excluded anything recorded today.
export function inclusiveEnd(to: Date) {
  return new Date(to.getTime() + DAY_MS);
}

export function resolveDateRange(input: { from?: Date; to?: Date }) {
  return {
    from: input.from ?? startOfYear(),
    to: input.to ? inclusiveEnd(input.to) : new Date(),
  };
}

export const offeringsQuerySchema = dateRangeSchema.extend({
  by: z.enum(["month", "service", "type", "perAttendee"]).optional(),
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
  platoonIds: idList(),
  squadIds: idList(),
});

export const groupsQuerySchema = dateRangeSchema;
