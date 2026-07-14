/**
 * Returns the next occurrence of a birthday (today or in the future) and days remaining.
 * Reads the month/day in UTC, not local time - `dob` is a date-only value (e.g. stored at
 * UTC midnight), so local getters would shift it a day in timezones behind UTC.
 */
export function getNextBirthday(dob: string | Date): { nextBirthday: Date; daysUntil: number } {
  const birthDate = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(today.getFullYear(), birthDate.getUTCMonth(), birthDate.getUTCDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, birthDate.getUTCMonth(), birthDate.getUTCDate());
  }

  const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { nextBirthday: next, daysUntil };
}
