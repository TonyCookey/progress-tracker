import RequireAuth from "@/components/auth/RequireAuth";
import FirstTimersTable from "@/components/firstTimers/FirstTimersTable";
import PageHeader from "@/components/ui/PageHeader";

export default function FirstTimersPage() {
  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="First Timers" />
        <FirstTimersTable />
      </div>
    </RequireAuth>
  );
}
