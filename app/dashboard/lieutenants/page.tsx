import LieutenantTable from "@/components/lieutenants/LieutenantTable";
import CreateLieutenantModal from "@/components/lieutenants/CreateLieutenantsModal";
import PageHeader from "@/components/ui/PageHeader";

export default function LieutenantsPage({ searchParams }: { searchParams: { baseId?: string; status?: string } }) {
  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Lieutenants" actions={<CreateLieutenantModal />} />
      {/* key: re-mount when arriving from a different dashboard link so filters reset */}
      <LieutenantTable key={`${searchParams.baseId ?? ""}-${searchParams.status ?? ""}`} initialBaseId={searchParams.baseId ?? ""} initialStatus={searchParams.status ?? ""} />
    </div>
  );
}
