import RequireAuth from "@/components/auth/RequireAuth";
import { getDashboardCards } from "@/lib/dashboard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

type DashboardCard = {
  label: string;
  value: number;
};

export default async function DashboardPage() {
  const cards = await getDashboardCards();

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Dashboard" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card: DashboardCard) => (
            <Card key={card.label} className="hover:shadow-softHover transition-shadow">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
              <p className="text-3xl font-extrabold mt-2 text-accent-700">{card.value}</p>
            </Card>
          ))}
        </div>
        <DashboardCharts />
      </div>
    </RequireAuth>
  );
}
