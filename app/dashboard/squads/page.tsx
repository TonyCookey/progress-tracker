import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupDirectory from "@/components/groups/GroupDirectory";
import { getGroups } from "@/lib/groups";
import { getBases } from "@/lib/bases";
import { getUsers } from "@/lib/users";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function SquadsPage({ searchParams }: { searchParams: { baseId?: string } }) {
  const [squads, bases, leaders] = await Promise.all([getGroups("SQUAD"), getBases(), getUsers()]);
  const squadMembers = (g: (typeof squads)[number]) => ({ ...g, _count: { members: g._count.members } });

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Squads" actions={<CreateGroupModal bases={bases} leaders={leaders} type="SQUAD" />} />
        <GroupDirectory
          groups={squads.map(squadMembers)}
          bases={[...bases].sort((a, b) => a.name.localeCompare(b.name))}
          baseId={searchParams.baseId}
          basePath="/dashboard/squads"
          noun="squad"
        />
      </div>
    </RequireAuth>
  );
}
