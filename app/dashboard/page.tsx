import RequireAuth from "@/components/auth/RequireAuth";
import { getDashboardCards } from "@/lib/dashboard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

type DashboardCard = {
  label: string;
  value: number;
};

export default async function DashboardPage() {
  const cards = await getDashboardCards();

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
        <DashboardCharts />
      </div>
    </RequireAuth>
  );
}
