import RequireAuth from "@/components/auth/RequireAuth";
import GraduandsView from "@/components/graduands/GraduandsView";

export default function GraduandsPage() {
  return (
    <RequireAuth>
      <GraduandsView />
    </RequireAuth>
  );
}
