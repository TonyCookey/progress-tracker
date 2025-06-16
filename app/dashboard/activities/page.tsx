import ActivitiesTable from "@/components/activities/ActivitiesTable";
import RequireAuth from "@/components/auth/RequireAuth";
import Link from "next/link";

export default function ActivitiesPage() {
  return (
    <RequireAuth>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Activities</h1>
          <Link href="/dashboard/activities/create" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Create Activity
          </Link>
        </div>

        <ActivitiesTable />
      </div>
    </RequireAuth>
  );
}
