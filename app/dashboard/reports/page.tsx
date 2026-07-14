import RequireAuth from "@/components/auth/RequireAuth";
import MonthlyReportBuilder from "@/components/reports/MonthlyReportBuilder";
import ReportsAnalyticsOverview from "@/components/reports/ReportsAnalyticsOverview";

export default function MonthlyReportPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>
        <ReportsAnalyticsOverview />
        <hr className="my-8" />
        <h2 className="text-xl font-semibold mb-6">Monthly Report Builder</h2>
        <MonthlyReportBuilder />
      </div>
    </RequireAuth>
  );
}
