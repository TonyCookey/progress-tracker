"use client";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EditHouseholdModal from "@/components/households/EditHouseholdModal";

type Household = {
  id: string;
  name: string;
  address: string | null;
  primaryContactName: string | null;
  primaryContactPhone: string | null;
  baseId?: string;
  base: { id: string; name: string } | null;
  teens: { id: string; name: string; rank: string }[];
};

export default function HouseholdDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [household, setHousehold] = useState(null as Household | null);

  async function fetchHousehold() {
    const res = await fetch(`/api/households/${id}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch household data");
      return;
    }
    const data = await res.json();
    if (!data) {
      console.error("No data found");
      return;
    }

    setHousehold({ ...data, baseId: data.base?.id });
  }

  useEffect(() => {
    fetchHousehold();
  }, [id]);

  const handleDelete = async () => {
    if (!household) return;
    if (!confirm("Are you sure you want to delete this household?")) return;

    const res = await fetch(`/api/households/${household.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete household");
      return;
    }
    alert("Household deleted successfully");
    router.push("/dashboard/households");
  };

  if (!household) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-900">{household.name}</h1>
        <p className="text-gray-600 mb-4">
          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">{household.base?.name ?? "No Base"}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 mb-6">
          <p className="text-gray-700 mb-1">
            <strong>Address:</strong> {household.address || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Primary Contact:</strong> {household.primaryContactName || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Contact Phone:</strong> {household.primaryContactPhone || "N/A"}
          </p>
        </div>
        <div className="flex gap-4 justify-end">
          <EditHouseholdModal household={household} onSuccess={fetchHousehold} />
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
            {household.teens?.length ?? 0} Member{household.teens?.length === 1 ? "" : "s"}
          </span>
        </div>
        {household.teens?.length ? (
          <ul className="divide-y divide-gray-200">
            {household.teens.map((teen) => (
              <Link href={`/dashboard/lieutenants/${teen.id}`} key={teen.id} className="block hover:bg-blue-50 rounded-lg px-1">
                <li className="flex items-center gap-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-sm font-bold text-blue-700 shadow">
                    {teen.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="font-medium text-blue-900 text-sm">{teen.name}</p>
                    <p className="text-xs text-gray-500">{teen.rank}</p>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No teens assigned to this household.</p>
        )}
      </div>
    </div>
  );
}
