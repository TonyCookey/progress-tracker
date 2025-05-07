import RequireAuth from "@/components/auth/RequireAuth";
import GeneralTable from "@/components/generals/GeneralsTable";

export default function GeneralsPage() {
  return (
    <RequireAuth>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Generals</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add General</button>
        </div>
        <div className="overflow-x-auto">
          <GeneralTable />
        </div>
      </div>
    </RequireAuth>
  );
}
