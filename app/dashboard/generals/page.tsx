import RequireAuth from "@/components/auth/RequireAuth";
import GeneralTable from "@/components/generals/GeneralsTable";
import PageHeader from "@/components/ui/PageHeader";

export default function GeneralsPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <PageHeader title="Generals, Colonels & Volunteers" />
        <GeneralTable />
      </div>
    </RequireAuth>
  );
}
