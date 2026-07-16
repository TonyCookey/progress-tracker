"use client";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EditHouseholdModal from "@/components/households/EditHouseholdModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

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
      <Card className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-neutral-900">{household.name}</h1>
        <p className="mb-4">
          <Badge tone="accent">{household.base?.name ?? "No Base"}</Badge>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 mb-6">
          <p className="text-neutral-700 mb-1">
            <strong>Address:</strong> {household.address || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong>Primary Contact:</strong> {household.primaryContactName || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong>Contact Phone:</strong> {household.primaryContactPhone || "N/A"}
          </p>
        </div>
        <div className="flex gap-4 justify-end">
          <EditHouseholdModal household={household} onSuccess={fetchHousehold} />
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Members</h2>
          <Badge tone="accent">
            {household.teens?.length ?? 0} Member{household.teens?.length === 1 ? "" : "s"}
          </Badge>
        </div>
        {household.teens?.length ? (
          <ul className="divide-y divide-neutral-200">
            {household.teens.map((teen) => (
              <Link href={`/dashboard/lieutenants/${teen.id}`} key={teen.id} className="block hover:bg-accent-50 rounded-lg px-1">
                <li className="flex items-center gap-4 py-3">
                  <Avatar name={teen.name ?? "?"} size="sm" />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">{teen.name}</p>
                    <p className="text-xs text-neutral-500">{teen.rank}</p>
                  </div>
                </li>
              </Link>
            ))}
          </ul>
        ) : (
          <p className="text-neutral-500">No teens assigned to this household.</p>
        )}
      </Card>
    </div>
  );
}
