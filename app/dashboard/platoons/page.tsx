import RequireAuth from "@/components/auth/RequireAuth";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import GroupDirectory from "@/components/groups/GroupDirectory";
import { getGroups } from "@/lib/groups";
import { getBases } from "@/lib/bases";
import { getUsers } from "@/lib/users";
import PageHeader from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function PlatoonsPage({ searchParams }: { searchParams: { baseId?: string } }) {
  const [platoons, bases, leaders] = await Promise.all([getGroups("PLATOON"), getBases(), getUsers()]);
  const platoonMembers = (g: (typeof platoons)[number]) => ({ ...g, _count: { teens: g._count.teens } });

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Platoons" actions={<CreateGroupModal bases={bases} leaders={leaders} type="PLATOON" />} />
        <GroupDirectory
          groups={platoons.map(platoonMembers)}
          bases={[...bases].sort((a, b) => a.name.localeCompare(b.name))}
          baseId={searchParams.baseId}
          basePath="/dashboard/platoons"
          noun="platoon"
        />
      </div>
    </RequireAuth>
  );
}
