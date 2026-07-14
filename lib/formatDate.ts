export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Formats a date-only value (e.g. an Activity date stored at UTC midnight) in the
 * UTC calendar day, not the viewer's/server's local timezone - avoids off-by-one-day
 * shifts for dates that don't carry meaningful time-of-day information.
 */
export function formatDateUTC(dateStr: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(dateStr));
}
