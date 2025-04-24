import RequireAuth from "@/components/auth/RequireAuth";

export default function GeneralsPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Generals & Colonels</h1>
        {/* List of teachers, ranks, base, assignments */}
      </div>
    </RequireAuth>
  );
}
