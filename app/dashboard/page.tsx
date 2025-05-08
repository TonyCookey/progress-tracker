import RequireAuth from "@/components/auth/RequireAuth";
type DashboardCard = {
  label: string;
  value: number;
};
export default async function DashboardPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const cards = await res.json();
  if (!res.ok) {
    console.error("[DASHBOARD_ERROR]", cards.error);
  }

  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card: DashboardCard) => (
            <div key={card.label} className="bg-white rounded-lg shadow p-5 border border-gray-100">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
