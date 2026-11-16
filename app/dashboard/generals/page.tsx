import RequireAuth from "@/components/auth/RequireAuth";
import GeneralTable from "@/components/generals/GeneralsTable";
import PageHeader from "@/components/ui/PageHeader";

export default function GeneralsPage({ searchParams }: { searchParams: { role?: string; baseId?: string } }) {
  return (
    <RequireAuth>
      <div className="p-4 md:p-6">
        <PageHeader title="Generals, Colonels & Volunteers" />
        <GeneralTable key={`${searchParams.role ?? ""}-${searchParams.baseId ?? ""}`} initialRole={searchParams.role ?? ""} initialBaseId={searchParams.baseId ?? ""} />
      </div>
    </RequireAuth>
  );
}
