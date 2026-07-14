export default function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: { value: number; direction: "up" | "down"; goodDirection?: "up" | "down" };
}) {
  const deltaGood = delta && delta.direction === (delta.goodDirection ?? "up");
  return (
    <div className="bg-white border rounded p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 ${deltaGood ? "text-green-700" : "text-amber-600"}`}>
          {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
