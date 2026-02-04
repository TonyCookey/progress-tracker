export function normalizeGender(value: string): "Male" | "Female" {
  const v = value.trim().toUpperCase();

  if (v === "M" || v === "MALE") return "Male";
  if (v === "F" || v === "FEMALE") return "Female";

  return "Female";
}
