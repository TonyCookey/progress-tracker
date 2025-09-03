import LieutenantTable from "@/components/lieutenants/LieutenantTable";
import CreateLieutenantModal from "@/components/lieutenants/CreateLieutenantsModal";

export default function LieutenantsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Lieutenants</h1>
        <CreateLieutenantModal />
      </div>
      <LieutenantTable />
    </div>
  );
}
