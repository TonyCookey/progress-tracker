import LieutenantTable from "@/components/lieutenants/LieutenantTable";
import CreateLieutenantModal from "@/components/lieutenants/CreateLieutenantsModal";
import PageHeader from "@/components/ui/PageHeader";

export default function LieutenantsPage() {
  return (
    <div className="p-6">
      <PageHeader title="Lieutenants" actions={<CreateLieutenantModal />} />
      <LieutenantTable />
    </div>
  );
}
