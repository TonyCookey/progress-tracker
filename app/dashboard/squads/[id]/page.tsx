"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDateUTC } from "@/lib/formatDate";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EditGroupModal from "@/components/groups/EditGroupModal";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StatTile from "@/components/charts/StatTile";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
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
      toast.error(data.error || "Failed to delete squad");
      return;
    }
    toast.success("Squad deleted successfully");
    setTimeout(() => router.push("/dashboard/squads"), 800);
  };

  if (!squad) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Squad Info Card */}
      <Card className="mb-8">
        <h1 className="text-2xl font-extrabold mb-2 text-neutral-900">{squad.name}</h1>
        <p className="text-neutral-600 mb-4">{squad.description}</p>
        <p className="mb-4">
          <Badge tone="accent">{squad.base?.name ?? "N/A"}</Badge>
        </p>
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-3">General Leading</h2>
          <Link href={`/dashboard/generals/${squad.leader?.id}`} className="block hover:bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar name={squad.leader?.name ?? "?"} size="lg" />
              <div>
                <p className="font-semibold text-neutral-900">{squad.leader?.name ?? "No leader assigned"}</p>
              </div>
            </div>
          </Link>
        </div>
        <div className="flex gap-4 justify-end">
          <EditGroupModal group={squad} label="Squad" onSuccess={fetchSquad} />
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Card>

      {/* Attendance Trend */}
      {(() => {
        // Activities with no ActivityParticipation rows yet (attendance never taken)
        // report rate: null - exclude them rather than counting as 0%, which would
        // understate real attendance.
        const recordedTrend = squad.attendanceTrend.filter((p) => p.rate !== null);
        return (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Attendance Trend</h2>
              <StatTile
                label="Average Attendance"
                value={recordedTrend.length ? `${Math.round(recordedTrend.reduce((sum, p) => sum + p.rate!, 0) / recordedTrend.length)}%` : "N/A"}
              />
            </div>
            {recordedTrend.length ? (
              <LineTrendChart
                title="Squad Attendance Over Time"
                labels={recordedTrend.map((p) => formatDateUTC(p.date, { month: "short", day: "numeric" }))}
                series={[{ name: "Attendance Rate", data: recordedTrend.map((p) => p.rate!) }]}
                formatValue={(n) => `${n}%`}
              />
            ) : (
              <p className="text-neutral-500">No attendance data yet.</p>
            )}
          </Card>
        );
      })()}

      {/* Main Content: Teens & Activities Side by Side */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Teens List Card */}
        <Card className="flex-1 mb-8 md:mb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Teens in this Squad</h2>
            <Badge tone="accent">
              {squad.members?.length ?? 0} Teen{squad.members?.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {squad.members?.length ? (
            <ul className="divide-y divide-neutral-200">
              {squad.members.map((teen: any) => (
                <Link href={`/dashboard/lieutenants/${teen.teenId}`} key={teen.teenId} className="block hover:bg-accent-50 rounded-lg px-1">
                  <li className="flex items-center gap-4 py-3">
                    <Avatar name={teen.teen.name ?? "?"} size="sm" />
                    <div>
                      <p className="font-medium text-neutral-900 text-sm">{teen.teen.name}</p>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">No teens assigned to this squad.</p>
          )}
        </Card>

        {/* Activities Card */}
        <Card className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Squad Activities</h2>
            <Badge tone="accent">
              {squad.activities?.length ?? 0} Activit{squad.activities?.length === 1 ? "y" : "ies"}
            </Badge>
          </div>
          {squad.activities?.length ? (
            <ul className="divide-y divide-neutral-200">
              {squad.activities
                .slice()
                .reverse()
                .map((activity: any) => (
                <Link href={`/dashboard/activities/${activity.id}`} key={activity.id} className="block hover:bg-accent-50 rounded-lg px-1">
                  <li key={activity.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-neutral-900">{activity.name}</span>
                      <span className="text-xs text-neutral-500">{formatDateUTC(activity.date, { month: "long", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">No activities for this squad.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
