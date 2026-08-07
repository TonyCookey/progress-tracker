import RequireAuth from "@/components/auth/RequireAuth";
import NewConvertsTable from "@/components/newConverts/NewConvertsTable";
import NewConvertsFunnelChart from "@/components/newConverts/NewConvertsFunnelChart";
import PageHeader from "@/components/ui/PageHeader";

export default function NewConvertsPage() {
  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="New Converts" />
        <NewConvertsFunnelChart />
        <NewConvertsTable />
      </div>
    </RequireAuth>
  );
}
