import RequireAuth from "@/components/auth/RequireAuth";
import GeneralTable from "@/components/generals/GeneralsTable";

export default function GeneralsPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Generals, Colonels & Volunteers</h1>
          <button className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Add General</button>
        </div>
        <GeneralTable />
      </div>
    </RequireAuth>
  );
}
