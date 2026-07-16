import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import Link from "next/link";
import { getGroups } from "@/lib/groups";
import { getBases } from "@/lib/bases";
import { getUsers } from "@/lib/users";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function SquadsPage() {
  const [squads, bases, leaders] = await Promise.all([getGroups("SQUAD"), getBases(), getUsers()]);

  return (
    <RequireAuth>
      <div className="p-6">
        <PageHeader title="Squads" actions={<CreateGroupModal bases={bases} leaders={leaders} type="SQUAD" />} />

        {squads.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {squads.map((squad: any) => (
              <li key={squad.id}>
                <Link href={`/dashboard/squads/${squad.id}`} className="block transition-transform hover:scale-[1.02]">
                  <Card className="flex flex-col gap-2 hover:shadow-softHover transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={squad.name ?? "S"} size="md" />
                      <h2 className="text-base font-bold text-neutral-900">{squad.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone="success" size="sm">
                        {squad.leader?.name ?? ""}
                      </Badge>
                      <Badge tone="neutral" size="sm">
                        {squad.base?.name ?? ""} Base
                      </Badge>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No squads yet" description="Create a squad to get started." />
        )}
      </div>
    </RequireAuth>
  );
}
