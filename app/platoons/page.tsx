import RequireAuth from "@/components/auth/RequireAuth";

export default function PlatoonsPage() {
  return (
    <RequireAuth>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Platoons</h1>
        {/* List and manage age/gender-based groups */}
      </div>
    </RequireAuth>
  );
}
