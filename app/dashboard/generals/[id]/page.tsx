"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatDate, formatDateUTC } from "@/lib/formatDate";
import { calculateAge } from "@/lib/calculateAge";
import EditGeneralModal from "@/components/generals/EditGeneralModal";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StatTile from "@/components/charts/StatTile";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

type TeachingRecord = {
  activityId: string;
  activityName: string;
  date: string;
  attended: boolean;
};

type General = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  base: { id: string; name: string };
  leadingGroups?: { id: string; name: string; type: string; teenCount: number }[];
  supportingGroups?: { group: { id: string; name: string; type: string; teenCount: number } }[];
  teaching: TeachingRecord[];
  teachingRate: number | null;
};

export default function GeneralDetailsPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [general, setGeneral] = useState(null as General | null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  async function fetchGeneral() {
    const res = await fetch(`/api/generals/${id}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch general data");
      return;
    }
    const data = await res.json();

    if (!data) {
      console.error("No data found");
      return;
    }
    setGeneral({ ...data, baseId: data.base?.id });
  }

  async function handlePasswordUpdate(oldPassword: string, newPassword: string) {
    const res = await fetch(`/api/generals/${id}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to update password");
    }
  }

  useEffect(() => {
    fetchGeneral();
  }, [id]);

  const handleDelete = async (generalId: string) => {
    if (!confirm("Are you sure you want to delete this general?")) return;

    const res = await fetch(`/api/generals/${generalId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      console.error("Failed to delete general", data);
      alert(data?.message ?? "Failed to delete general");
      return;
    }
    alert("General deleted successfully");
    window.location.href = "/dashboard/generals";
  };

  if (!general) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Profile Card */}
        <Card className="flex-1 flex items-center gap-6">
          <Avatar name={general.name ?? "?"} size="lg" />
          <div>
            <h2 className="text-3xl font-bold mb-2 text-neutral-900">{general.name}</h2>
            <Badge tone="accent" className="mb-2">
              {general.role}
            </Badge>
            <p className="text-neutral-600 mb-1">
              <strong className="text-neutral-800">Gender:</strong> {general.gender}
            </p>
            <p className="text-neutral-600 mb-1">
              <strong className="text-neutral-800">Date of Birth:</strong> {formatDate(general.dateOfBirth)}
            </p>
          </div>
        </Card>

        {/* Assignments Card */}
        <Card className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-4">Assignments</h3>
          <div className="space-y-2 text-base text-neutral-700">
            <p>
              <strong className="text-neutral-800">Base:</strong> <span className="text-accent-700">{general.base.name}</span>
            </p>
            <div>
              <strong className="text-neutral-800">Leading Groups:</strong>{" "}
              {general.leadingGroups?.length ? (
                <ul className="list-disc list-inside">
                  {general.leadingGroups.map((g) => (
                    <li key={g.id}>
                      <Link href={`/dashboard/${g.type === "PLATOON" ? "platoons" : "squads"}/${g.id}`} className="text-accent-700 hover:underline">
                        {g.name}
                      </Link>{" "}
                      <span className="text-sm text-neutral-500">
                        ({g.teenCount} teen{g.teenCount === 1 ? "" : "s"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-neutral-500">N/A</span>
              )}
            </div>
            <div>
              <strong className="text-neutral-800">Supporting Groups:</strong>{" "}
              {general.supportingGroups?.length ? (
                <ul className="list-disc list-inside">
                  {general.supportingGroups.map((s) => (
                    <li key={s.group.id}>
                      <Link
                        href={`/dashboard/${s.group.type === "PLATOON" ? "platoons" : "squads"}/${s.group.id}`}
                        className="text-accent-700 hover:underline"
                      >
                        {s.group.name}
                      </Link>{" "}
                      <span className="text-sm text-neutral-500">
                        ({s.group.teenCount} teen{s.group.teenCount === 1 ? "" : "s"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-neutral-500">None</span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatTile label="Age" value={general.dateOfBirth ? `${calculateAge(general.dateOfBirth)} yrs` : "N/A"} />
        <StatTile label="Activities Taught" value={general.teaching.length} />
        <StatTile label="Teaching Attendance Rate" value={general.teachingRate !== null ? `${general.teachingRate}%` : "N/A"} />
      </div>

      {/* Teacher Attendance */}
      <Card className="mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-4">Teaching Activity</h3>
        {general.teaching.length ? (
          <>
            <LineTrendChart
              title="Teaching Attendance Trend"
              labels={general.teaching.map((t) => formatDateUTC(t.date, { month: "short", day: "numeric" }))}
              series={[
                {
                  name: "Cumulative Attendance Rate",
                  data: general.teaching.reduce<number[]>((acc, t, i) => {
                    const attendedSoFar = general.teaching.slice(0, i + 1).filter((x) => x.attended).length;
                    acc.push(Math.round((attendedSoFar / (i + 1)) * 100));
                    return acc;
                  }, []),
                },
              ]}
              formatValue={(n) => `${n}%`}
            />
            <ul className="divide-y divide-neutral-100 mt-4">
              {general.teaching
                .slice()
                .reverse()
                .map((t) => (
                  <li key={t.activityId} className="flex items-center justify-between py-2">
                    <Link href={`/dashboard/activities/${t.activityId}`} className="text-sm font-medium text-neutral-800 hover:underline">
                      {t.activityName}
                    </Link>
                    <span className="text-xs text-neutral-500">{formatDateUTC(t.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                    <Badge tone={t.attended ? "success" : "danger"} size="sm">
                      {t.attended ? "Attended" : "Absent"}
                    </Badge>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-neutral-500">No teaching activity recorded yet.</p>
        )}
      </Card>

      <div className="flex gap-4 justify-end">
        {session?.user?.id === general.id && (
          <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
            Change Password
          </Button>
        )}
        <EditGeneralModal general={general} onSuccess={fetchGeneral} />
        <Button variant="danger" onClick={() => handleDelete(general.id)}>
          Delete
        </Button>
      </div>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSubmit={handlePasswordUpdate} />
    </div>
  );
}
