"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate } from "@/lib/formatDate";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EditGroupModal from "@/components/groups/EditGroupModal";

type Platoon = {
  id: string;
  name: string;
  description: string | null;
  baseId?: string;
  leaderId?: string;
  base: { id: string; name: string } | null;
  leader: { id: string; name: string; email: string } | null;
  support?: { user: { id: string; name: string } }[] | null;
  activities: { id: string; title: string; date: string }[] | null;
  teens: { id: string; name: string; email: string }[] | null;
};

export default function PlatoonDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [platoon, setPlatoon] = useState(null as Platoon | null);

  async function fetchPlatoon() {
    const res = await fetch(`/api/groups/${id}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch platoon data");
      return;
    }
    const data = await res.json();
    if (!data) {
      console.error("No data found");
      return;
    }

    setPlatoon({
      ...data,
      baseId: data.base?.id,
      leaderId: data.leader?.id,
      supportIds: data.support?.map((s: any) => s.user.id) ?? [],
    });
  }

  useEffect(() => {
    fetchPlatoon();
  }, [id]);

  const handleDelete = async () => {
    if (!platoon) return;
    if (!confirm("Are you sure you want to delete this platoon?")) return;

    const res = await fetch(`/api/groups/${platoon.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete platoon");
      return;
    }
    alert("Platoon deleted successfully");
    router.push("/dashboard/platoons");
  };

  if (!platoon) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Platoon Info Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-900">{platoon.name}</h1>
        <p className="text-gray-600 mb-4">{platoon.description}</p>
        <p className="text-gray-600 mb-4">
          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">{platoon.base?.name ?? "N/A"}</span>
        </p>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-3">General Leading</h2>
          <Link href={`/dashboard/generals/${platoon.leader?.id}`} className="block hover:bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-2xl font-bold text-blue-700 shadow">
                {platoon.leader?.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-cyan-900">{platoon.leader?.name ?? "No leader assigned"}</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex gap-4 justify-end">
          <EditGroupModal group={platoon} label="Platoon" onSuccess={fetchPlatoon} />
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
            Delete
          </button>
        </div>
      </div>

      {/* Main Content: Teens & Activities Side by Side */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Teens List Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 mb-8 md:mb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Teens in this Platoon</h2>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {platoon.teens?.length ?? 0} Teen{platoon.teens?.length === 1 ? "" : "s"}
            </span>
          </div>
          {platoon.teens?.length ? (
            <ul className="divide-y divide-gray-200">
              {platoon.teens.map((teen: any) => (
                <Link href={`/dashboard/lieutenants/${teen.id}`} key={teen.id} className="block hover:bg-blue-50 rounded-lg px-1">
                  <li className="flex items-center gap-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-sm font-bold text-blue-700 shadow">
                      {teen.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm">{teen.name}</p>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No teens assigned to this platoon.</p>
          )}
        </div>

        {/* Activities Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Platoon Activities</h2>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {platoon.activities?.length ?? 0} Activit{platoon.activities?.length === 1 ? "y" : "ies"}
            </span>
          </div>
          {platoon.activities?.length ? (
            <ul className="divide-y divide-gray-200">
              {platoon.activities.map((activity: any) => (
                <Link href={`/dashboard/activities/${activity.id}`} key={activity.id} className="block hover:bg-blue-50 rounded-lg px-1">
                  <li key={activity.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-cyan-900">{activity.name}</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.date)}</span>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No activities for this platoon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
