import RequireAuth from "@/components/auth/RequireAuth";
import ReportsWorkspace from "@/components/reports/ReportsWorkspace";
import PageHeader from "@/components/ui/PageHeader";
import { getSession } from "@/lib/auth";

export default async function MonthlyReportPage() {
  const session = await getSession();
  // The report builder/history APIs are SUPERADMIN + GENERAL only; other roles get analytics.
  const canBuild = session?.user?.role === "SUPERADMIN" || session?.user?.role === "GENERAL";

  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Reports" description="Build the monthly base report, download past reports, and dig into attendance." />
        <ReportsWorkspace canBuild={canBuild} />
      </div>
    </RequireAuth>
  );
}
