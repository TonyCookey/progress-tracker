type MoneyInput = number | string | { toString(): string } | null | undefined;

const formatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as Naira, e.g. formatMoney(437800) -> "₦437,800.00", formatMoney(-500) -> "-₦500.00". */
export function formatMoney(amount: MoneyInput): string {
  const raw = amount === null || amount === undefined ? 0 : Number(amount.toString());
  const value = Number.isFinite(raw) ? raw : 0;
  const sign = value < 0 ? "-" : "";
  return `${sign}₦${formatter.format(Math.abs(value))}`;
}
