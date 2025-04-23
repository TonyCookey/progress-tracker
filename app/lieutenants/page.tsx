import RequireAuth from "@/components/auth/RequireAuth";

export default function TeensPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Lieutenants (Teens)</h1>
        {/* List of teens, roles, group affiliations */}
      </div>
    </RequireAuth>
  );
}
