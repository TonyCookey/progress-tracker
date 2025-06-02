import ActivitiesTable from "@/components/activities/ActivitiesTable";
import RequireAuth from "@/components/auth/RequireAuth";
import CreateActivityModal from "@/components/modals/CreateActivityModal";

export default function ActivitiesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Activities</h1>
          <CreateActivityModal />
        </div>

        <ActivitiesTable />
      </div>
    </RequireAuth>
  );
}
