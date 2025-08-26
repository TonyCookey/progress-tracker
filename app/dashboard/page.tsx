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
          {cards.map((card: DashboardCard, idx: number) => (
            <div
              key={card.label}
              className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col items-start hover:shadow-xl transition-shadow"
            >
              <p className="text-base text-gray-600 font-medium">{card.label}</p>
              <p className="text-4xl font-extrabold mt-2 text-blue-700">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </RequireAuth>
  );
}
