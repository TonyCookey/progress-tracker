import Link from "next/link";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import { getGroups } from "@/lib/groups";
import { getBases } from "@/lib/bases";
import { getUsers } from "@/lib/users";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function PlatoonsPage() {
  const [platoons, bases, leaders] = await Promise.all([getGroups("PLATOON"), getBases(), getUsers()]);

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Platoons" actions={<CreateGroupModal bases={bases} leaders={leaders} type="PLATOON" />} />

        {platoons.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platoons.map((squad: any) => (
              <li key={squad.id}>
                <Link href={`/dashboard/platoons/${squad.id}`} className="block transition-transform hover:scale-[1.02]">
                  <Card className="flex flex-col gap-2 hover:shadow-softHover transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={squad.name ?? "P"} size="md" />
                      <h2 className="text-base font-bold text-neutral-900">{squad.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="success" size="sm">
                        {squad.leader?.name ?? "No Leader"}
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {squad.base?.name ?? "No Base"} Base
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No platoons yet" description="Create a platoon to get started." />
        )}
      </div>
    </RequireAuth>
  );
}
