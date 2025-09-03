import OfferingsTable from "@/components/offerings/OfferingsTable";
import RecordOfferingModal from "@/components/offerings/RecordOfferingForm";
import Link from "next/link";

export default function OfferingsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Offerings</h1>
        <Link href="/dashboard/offerings/create">
          <button className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700">Record Offering</button>
        </Link>
      </div>
      <OfferingsTable />
    </div>
  );
}
