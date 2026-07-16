import ActivitiesTable from "@/components/activities/ActivitiesTable";
import RequireAuth from "@/components/auth/RequireAuth";
import LinkButton from "@/components/ui/LinkButton";
import PageHeader from "@/components/ui/PageHeader";

export default function ActivitiesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6 p-6">
        <PageHeader
          title="Activities"
          actions={<LinkButton href="/dashboard/activities/create">Create Activity</LinkButton>}
        />

        <ActivitiesTable />
      </div>
    </RequireAuth>
  );
}
