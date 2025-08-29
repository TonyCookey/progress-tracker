export function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}
