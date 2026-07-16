import RequireAuth from "@/components/auth/RequireAuth";
import MonthlyReportBuilder from "@/components/reports/MonthlyReportBuilder";
import ReportsAnalyticsOverview from "@/components/reports/ReportsAnalyticsOverview";
import PageHeader from "@/components/ui/PageHeader";

export default function MonthlyReportPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <PageHeader title="Reports" />
        <ReportsAnalyticsOverview />
        <div className="mt-10 pt-10 border-t border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Monthly Report Builder</h2>
          <MonthlyReportBuilder />
        </div>
      </div>
    </RequireAuth>
  );
}
