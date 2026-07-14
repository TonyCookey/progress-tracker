/** Returns the next occurrence of a birthday (today or in the future) and days remaining. */
export function getNextBirthday(dob: string | Date): { nextBirthday: Date; daysUntil: number } {
  const birthDate = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (next < today) {
    next = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }

  const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { nextBirthday: next, daysUntil };
}
