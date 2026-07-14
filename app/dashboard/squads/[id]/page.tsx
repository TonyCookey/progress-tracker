"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDateUTC } from "@/lib/formatDate";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EditGroupModal from "@/components/groups/EditGroupModal";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StatTile from "@/components/charts/StatTile";

type AttendanceTrendPoint = { activityId: string; activityName: string; date: string; rate: number | null };

type Squad = {
  id: string;
  name: string;
  description: string | null;
  baseId?: string;
  leaderId?: string;
  base: { id: string; name: string } | null;
  leader: { id: string; name: string } | null;
  support?: { user: { id: string; name: string } }[] | null;
  activities: { id: string; name: string; date: string }[] | null;
  members: { id: string; teenId: string; teen: { id: string; name: string } }[] | null;
  attendanceTrend: AttendanceTrendPoint[];
};

export default function SquadDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [squad, setSquad] = useState(null as Squad | null);

  async function fetchSquad() {
    const res = await fetch(`/api/groups/${id}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch squad data");
      return;
    }
    const data = await res.json();
    if (!data) {
      console.error("No data found");
      return;
    }

    setSquad({
      ...data,
      baseId: data.base?.id,
      leaderId: data.leader?.id,
      supportIds: data.support?.map((s: any) => s.user.id) ?? [],
    });
  }

  useEffect(() => {
    fetchSquad();
  }, [id]);

  const handleDelete = async () => {
    if (!squad) return;
    if (!confirm("Are you sure you want to delete this squad?")) return;

    const res = await fetch(`/api/groups/${squad.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete squad");
      return;
    }
    alert("Squad deleted successfully");
    router.push("/dashboard/squads");
  };

  if (!squad) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Squad Info Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-900">{squad.name}</h1>
        <p className="text-gray-600 mb-4">{squad.description}</p>
        <p className="text-gray-600 mb-4">
          <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">{squad.base?.name ?? "N/A"}</span>
        </p>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-3">General Leading</h2>
          <Link href={`/dashboard/generals/${squad.leader?.id}`} className="block hover:bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-2xl font-bold text-blue-700 shadow">
                {squad.leader?.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-semibold text-cyan-900">{squad.leader?.name ?? "No leader assigned"}</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex gap-4 justify-end">
          <EditGroupModal group={squad} label="Squad" onSuccess={fetchSquad} />
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
            Delete
          </button>
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Attendance Trend</h2>
          <StatTile
            label="Average Attendance"
            value={
              squad.attendanceTrend.length
                ? `${Math.round(squad.attendanceTrend.reduce((sum, p) => sum + (p.rate ?? 0), 0) / squad.attendanceTrend.length)}%`
                : "N/A"
            }
          />
        </div>
        {squad.attendanceTrend.length ? (
          <LineTrendChart
            title="Squad Attendance Over Time"
            labels={squad.attendanceTrend.map((p) => formatDateUTC(p.date, { month: "short", day: "numeric" }))}
            series={[{ name: "Attendance Rate", data: squad.attendanceTrend.map((p) => p.rate ?? 0) }]}
            formatValue={(n) => `${n}%`}
          />
        ) : (
          <p className="text-gray-500">No attendance data yet.</p>
        )}
      </div>

      {/* Main Content: Teens & Activities Side by Side */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Teens List Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8 mb-8 md:mb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Teens in this Platoon</h2>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {squad.members?.length ?? 0} Teen{squad.members?.length === 1 ? "" : "s"}
            </span>
          </div>
          {squad.members?.length ? (
            <ul className="divide-y divide-gray-200">
              {squad.members.map((teen: any) => (
                <Link href={`/dashboard/lieutenants/${teen.teenId}`} key={teen.teenId} className="block hover:bg-blue-50 rounded-lg px-1">
                  <li className="flex items-center gap-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-sm font-bold text-blue-700 shadow">
                      {teen.teen.name?.[0] ?? "?"}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 text-sm">{teen.teen.name}</p>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No teens assigned to this squad.</p>
          )}
        </div>

        {/* Activities Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Squad Activities</h2>
            <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {squad.activities?.length ?? 0} Activit{squad.activities?.length === 1 ? "y" : "ies"}
            </span>
          </div>
          {squad.activities?.length ? (
            <ul className="divide-y divide-gray-200">
              {squad.activities.map((activity: any) => (
                <Link href={`/dashboard/activities/${activity.id}`} key={activity.id} className="block hover:bg-blue-50 rounded-lg px-1">
                  <li key={activity.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-cyan-900">{activity.name}</span>
                      <span className="text-xs text-gray-500">{formatDateUTC(activity.date, { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No activities for this squad.</p>
          )}
        </div>
      </div>
    </div>
  );
}
