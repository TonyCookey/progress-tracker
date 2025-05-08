import LieutenantTable from "@/components/lieutenants/LieutenantTable";
import CreateLieutenantModal from "@/components/modals/CreateLieutenantsModal";

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
// This page fetches and displays a list of lieutenants, along with a modal to create new lieutenants.
