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
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Profile Card */}
        <div className="flex-1 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-xl shadow-lg p-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-cyan-300 flex items-center justify-center text-4xl font-bold text-white shadow">
            {general.name?.[0] ?? "?"}
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2 text-cyan-900">{general.name}</h2>
            <span className="inline-block bg-cyan-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">{general.role}</span>
            <p className="text-gray-700 mb-1">
              <strong>Gender:</strong> {general.gender}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Date of Birth:</strong> {formatDate(general.dateOfBirth)}
            </p>
          </div>
        </div>

        {/* Assignments Card */}
        <div className="flex-1 bg-white rounded-lg shadow p-8">
          <h3 className="text-xl font-semibold mb-4 text-cyan-800">Assignments</h3>
          <div className="space-y-2 text-lg">
            <p>
              <strong>Base:</strong> <span className="text-cyan-700">{general.base.name}</span>
            </p>
            <div>
              <strong>Leading Groups:</strong>{" "}
              {general.leadingGroups?.length ? (
                <ul className="list-disc list-inside">
                  {general.leadingGroups.map((g) => (
                    <li key={g.id}>
                      <Link href={`/dashboard/${g.type === "PLATOON" ? "platoons" : "squads"}/${g.id}`} className="text-cyan-700 hover:underline">
                        {g.name}
                      </Link>{" "}
                      <span className="text-sm text-gray-500">
                        ({g.teenCount} teen{g.teenCount === 1 ? "" : "s"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </div>
            <div>
              <strong>Supporting Groups:</strong>{" "}
              {general.supportingGroups?.length ? (
                <ul className="list-disc list-inside">
                  {general.supportingGroups.map((s) => (
                    <li key={s.group.id}>
                      <Link
                        href={`/dashboard/${s.group.type === "PLATOON" ? "platoons" : "squads"}/${s.group.id}`}
                        className="text-cyan-700 hover:underline"
                      >
                        {s.group.name}
                      </Link>{" "}
                      <span className="text-sm text-gray-500">
                        ({s.group.teenCount} teen{s.group.teenCount === 1 ? "" : "s"})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatTile label="Age" value={general.dateOfBirth ? `${calculateAge(general.dateOfBirth)} yrs` : "N/A"} />
        <StatTile label="Activities Taught" value={general.teaching.length} />
        <StatTile label="Teaching Attendance Rate" value={general.teachingRate !== null ? `${general.teachingRate}%` : "N/A"} />
      </div>

      {/* Teacher Attendance */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-cyan-800">Teaching Activity</h3>
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
            <ul className="divide-y divide-gray-200 mt-4">
              {general.teaching
                .slice()
                .reverse()
                .map((t) => (
                  <li key={t.activityId} className="flex items-center justify-between py-2">
                    <Link href={`/dashboard/activities/${t.activityId}`} className="text-sm font-medium text-gray-800 hover:underline">
                      {t.activityName}
                    </Link>
                    <span className="text-xs text-gray-500">{formatDateUTC(t.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${t.attended ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {t.attended ? "Attended" : "Absent"}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">No teaching activity recorded yet.</p>
        )}
      </div>

      <div className="flex gap-4 justify-end">
        {session?.user?.id === general.id && (
          <button
            onClick={() => setShowPasswordModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
          >
            Change Password
          </button>
        )}
        <EditGeneralModal general={general} onSuccess={fetchGeneral} />
        <button onClick={() => handleDelete(general.id)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
          Delete
        </button>
      </div>

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSubmit={handlePasswordUpdate} />
    </div>
  );
}
