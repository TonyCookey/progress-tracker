type MoneyInput = number | string | { toString(): string } | null | undefined;

const formatter = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats an amount as Naira, e.g. formatMoney(437800) -> "₦437,800.00". */
export function formatMoney(amount: MoneyInput): string {
  const value = amount === null || amount === undefined ? 0 : Number(amount.toString());
  return `₦${formatter.format(Number.isFinite(value) ? value : 0)}`;
}
