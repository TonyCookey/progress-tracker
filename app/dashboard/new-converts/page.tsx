import RequireAuth from "@/components/auth/RequireAuth";
import NewConvertsTable from "@/components/newConverts/NewConvertsTable";

export default function NewConvertsPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">New Converts</h1>
        </div>
        <NewConvertsTable />
      </div>
    </RequireAuth>
  );
}
