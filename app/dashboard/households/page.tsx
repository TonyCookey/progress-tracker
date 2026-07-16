import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateHouseholdModal from "@/components/households/CreateHouseholdModal";
import { getHouseholds } from "@/lib/households";
import { getBases } from "@/lib/bases";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function HouseholdsPage() {
  const [households, bases] = await Promise.all([getHouseholds(), getBases()]);

  return (
    <RequireAuth>
      <div className="p-6">
        <PageHeader title="Households" actions={<CreateHouseholdModal bases={bases} />} />

        {households.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {households.map((household: any) => (
              <li key={household.id}>
                <Link href={`/dashboard/households/${household.id}`} className="block transition-transform hover:scale-[1.02]">
                  <Card className="flex flex-col gap-2 hover:shadow-softHover transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={household.name ?? "H"} size="md" />
                      <h2 className="text-lg font-bold text-neutral-900">{household.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="neutral" size="sm">
                        {household.base?.name ?? "No Base"} Base
                      </Badge>
                      <Badge tone="success" size="sm">
                        {household.teens?.length ?? 0} Member{household.teens?.length === 1 ? "" : "s"}
                      </Badge>
                    </div>
                    {household.primaryContactName && <p className="text-sm text-neutral-600">{household.primaryContactName}</p>}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No households yet" description="Create a household to get started." />
        )}
      </div>
    </RequireAuth>
  );
}
