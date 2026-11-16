import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import RequireAuth from "@/components/auth/RequireAuth";
import { getDashboardSummary } from "@/lib/dashboard";
import { getSession } from "@/lib/auth";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const scopeBaseId = session?.user && session.user.role !== "SUPERADMIN" ? session.user.baseId : undefined;
  const { headline, roles, bases } = await getDashboardSummary(scopeBaseId);

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Dashboard" description="Click any number to open the matching list." />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {headline.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <Card padded className="p-5 h-full transition-shadow group-hover:shadow-softHover">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{card.label}</p>
                  <ArrowUpRightIcon className="w-4 h-4 text-neutral-300 group-hover:text-accent-600 transition-colors" aria-hidden />
                </div>
                <p className="text-3xl font-extrabold mt-2 text-accent-700 tabular-nums">{card.value}</p>
                {card.hint && <p className="text-xs text-neutral-400 mt-1">{card.hint}</p>}
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mr-1">Generals by role</span>
          {roles.map((role) => (
            <Link
              key={role.label}
              href={role.href}
              className="inline-flex items-center gap-2 rounded-pill border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-accent-300 hover:text-accent-700 transition-colors"
            >
              {role.label}
              <span className="font-semibold tabular-nums text-neutral-900">{role.value}</span>
            </Link>
          ))}
        </div>

        {bases.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Bases</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bases.map((base) => (
                <Card key={base.id} padded className="p-5">
                  <div className="flex items-baseline gap-2 mb-4">
                    <h3 className="text-base font-bold text-neutral-900">{base.name}</h3>
                    {base.label && <span className="text-sm text-neutral-500">{base.label}</span>}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {base.stats.map((stat) => (
                      <Link
                        key={stat.label}
                        href={stat.href}
                        className="rounded-xl bg-neutral-50 px-3 py-3 hover:bg-accent-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                      >
                        <p className="text-2xl font-bold text-neutral-900 tabular-nums">{stat.value}</p>
                        <p className="text-xs text-neutral-500">{stat.label}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DashboardCharts />
      </div>
    </RequireAuth>
  );
}
