"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { calculateAge } from "@/lib/calculateAge";
import { formatDate } from "@/lib/formatDate";
import LieutenantAvatar from "@/components/lieutenants/AvatarImage";
import EditLieutenantModal from "@/components/lieutenants/EditLieutenantsModal";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StatTile from "@/components/charts/StatTile";
import { formatDateUTC } from "@/lib/formatDate";
import { getNextBirthday } from "@/lib/getNextBirthday";

type AttendanceRecord = {
  activityId: string;
  activityName: string;
  date: string;
  attended: boolean;
};

type Teen = {
  id: string;
  name: string;
  rank: string;
  gender: string;
  dateOfBirth: string;
  base: { id: string; name: string };
  baseId?: string;
  groupId?: string;
  platoon?: { id: string; name: string };
  squads: { id: string; name: string }[];
  squadIds?: string[];
  householdId?: string | null;
  household?: { id: string; name: string } | null;
  siblings?: { id: string; name: string }[];
  imageKey?: string;
  phone?: string | null;
  address?: string | null;
  school?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  dateJoined?: string | null;
  status?: string;
  attendance: AttendanceRecord[];
  attendanceRate: number | null;
};

function getColorClasses(gender: string) {
  if (gender === "Male") {
    return {
      gradient: "bg-gradient-to-r from-blue-50 to-blue-100",
      avatar: "bg-blue-300",
      name: "text-blue-900",
      badge: "bg-blue-600",
      assignment: "text-blue-700",
      header: "text-blue-800",
    };
  } else {
    return {
      gradient: "bg-gradient-to-r from-pink-50 to-pink-100",
      avatar: "bg-pink-300",
      name: "text-pink-900",
      badge: "bg-pink-600",
      assignment: "text-pink-700",
      header: "text-pink-800",
    };
  }
}

export default function TeenDetailsPage() {
  const { id } = useParams();
  const [teen, setTeen] = useState(null as Teen | null);

  async function fetchTeen() {
    const res = await fetch(`/api/lieutenants/${id}`, { cache: "no-store" });
    if (!res.ok) {
      console.error("Failed to fetch teen data");
      return;
    }
    const data = await res.json();
    if (!data) {
      console.error("No data found");
      return;
    }
    setTeen({
      ...data,
      baseId: data.base?.id,
      groupId: data.platoon?.id,
      squadIds: data.squads?.map((s: any) => s.id) ?? [],
    });
  }

  useEffect(() => {
    fetchTeen();
  }, [id]);

  const handleDelete = async (teenId: string) => {
    if (!confirm("Are you sure you want to delete this lieutenant?")) return;

    const res = await fetch(`/api/lieutenants/${teenId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete lieutenant");
      return;
    }
    alert("Lieutenant deleted successfully");
    window.location.href = "/dashboard/lieutenants";
  };

  if (!teen) return <LoadingSpinner />;

  const color = getColorClasses(teen.gender);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Profile Card */}
        <div className={`flex-1 ${color.gradient} rounded-xl shadow-lg p-8 flex items-center gap-6`}>
          {teen.imageKey ? (
            <LieutenantAvatar imageKey={teen.imageKey} alt={`${teen.name}'s profile`} size={80} />
          ) : (
            <div className={`w-24 h-24 rounded-full ${color.avatar} flex items-center justify-center text-4xl font-bold text-white shadow`}>
              {teen.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${color.name}`}>{teen.name}</h2>
            <span className={`inline-block ${color.badge} text-white px-3 py-1 rounded-full text-sm font-semibold mb-2`}>{teen.rank}</span>
            <p className="text-gray-700 mb-1">
              <strong>Gender:</strong> {teen.gender}
            </p>
            <p className="text-gray-700 mb-1">
              <strong>Date of Birth:</strong> {formatDate(teen.dateOfBirth)} ({calculateAge(teen.dateOfBirth)} yrs)
            </p>
          </div>
        </div>

        {/* Assignments Card */}
        <div className="flex-1 bg-white rounded-lg shadow p-8">
          <h3 className={`text-xl font-semibold mb-4 ${color.header}`}>Assignments</h3>
          <div className="space-y-2 text-lg">
            <p>
              <strong>Base:</strong> <span className={color.assignment}>{teen.base.name}</span>
            </p>
            <p>
              <strong>Platoon:</strong>{" "}
              <a
                href={teen.platoon ? `/dashboard/platoons/${teen.platoon.id}` : "#"}
                className={color.assignment + (teen.platoon ? " hover:underline" : " text-gray-500")}
              >
                <span className={color.assignment}>{teen.platoon?.name || "N/A"}</span>
              </a>
            </p>
            <p>
              <strong>Household:</strong>{" "}
              <a
                href={teen.household ? `/dashboard/households/${teen.household.id}` : "#"}
                className={color.assignment + (teen.household ? " hover:underline" : " text-gray-500")}
              >
                <span className={color.assignment}>{teen.household?.name || "N/A"}</span>
              </a>
            </p>
            <p>
              <strong>Squads:</strong>{" "}
              {teen.squads.length ? (
                <a
                  href={teen.squads ? `/dashboard/squads/${teen.squads.map((s) => s.id).join(",")}` : "#"}
                  className={color.assignment + (teen.squads ? " hover:underline" : " text-gray-500")}
                >
                  <span className={color.assignment}>{teen.squads.map((s) => s.name).join(", ")}</span>
                </a>
              ) : (
                <span className="text-gray-500">None</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Age" value={`${calculateAge(teen.dateOfBirth)} yrs`} />
        <StatTile
          label="Next Birthday"
          value={`${getNextBirthday(teen.dateOfBirth).daysUntil} day${getNextBirthday(teen.dateOfBirth).daysUntil === 1 ? "" : "s"}`}
        />
        <StatTile label="Activities Logged" value={teen.attendance.length} />
        <StatTile label="Attendance Rate" value={teen.attendanceRate !== null ? `${teen.attendanceRate}%` : "N/A"} />
      </div>

      {/* Pastoral Info Card */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${color.header}`}>Pastoral Info</h3>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              teen.status === "LEFT" ? "bg-gray-500 text-white" : teen.status === "INACTIVE" ? "bg-yellow-500 text-white" : "bg-green-600 text-white"
            }`}
          >
            {teen.status ?? "ACTIVE"}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1">
          <p className="text-gray-700 mb-1">
            <strong>Phone:</strong> {teen.phone || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Address:</strong> {teen.address || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>School:</strong> {teen.school || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Date Joined:</strong> {teen.dateJoined ? formatDate(teen.dateJoined) : "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Guardian Name:</strong> {teen.guardianName || "N/A"}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Guardian Phone:</strong> {teen.guardianPhone || "N/A"}
          </p>
        </div>
      </div>

      {/* Siblings (same household) */}
      {teen.household && (
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${color.header}`}>
              Siblings <span className="text-gray-500 font-normal text-base">({teen.household.name})</span>
            </h3>
          </div>
          {teen.siblings?.length ? (
            <ul className="divide-y divide-gray-200">
              {teen.siblings.map((sibling) => (
                <Link href={`/dashboard/lieutenants/${sibling.id}`} key={sibling.id} className="block hover:bg-blue-50 rounded-lg px-1">
                  <li className="flex items-center gap-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-sm font-bold text-blue-700 shadow">
                      {sibling.name?.[0] ?? "?"}
                    </div>
                    <p className="font-medium text-blue-900 text-sm">{sibling.name}</p>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No other teens in this household.</p>
          )}
        </div>
      )}

      {/* Attendance */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${color.header}`}>Attendance</h3>
        {teen.attendance.length ? (
          <>
            <LineTrendChart
              title="Attendance Rate Over Time"
              labels={teen.attendance.map((a) => formatDateUTC(a.date, { month: "short", day: "numeric" }))}
              series={[
                {
                  name: "Cumulative Attendance Rate",
                  data: teen.attendance.reduce<number[]>((acc, a, i) => {
                    const attendedSoFar = teen.attendance.slice(0, i + 1).filter((x) => x.attended).length;
                    acc.push(Math.round((attendedSoFar / (i + 1)) * 100));
                    return acc;
                  }, []),
                },
              ]}
              formatValue={(n) => `${n}%`}
            />
            <ul className="divide-y divide-gray-200 mt-4">
              {teen.attendance
                .slice()
                .reverse()
                .map((a) => (
                  <li key={a.activityId} className="flex items-center justify-between py-2">
                    <Link href={`/dashboard/activities/${a.activityId}`} className="text-sm font-medium text-gray-800 hover:underline">
                      {a.activityName}
                    </Link>
                    <span className="text-xs text-gray-500">{formatDateUTC(a.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${a.attended ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {a.attended ? "Attended" : "Absent"}
                    </span>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-500">No attendance records yet.</p>
        )}
      </div>

      <div className="flex gap-4 justify-end">
        <EditLieutenantModal lieutenant={teen} onSuccess={fetchTeen} />
        <button onClick={() => handleDelete(teen.id)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
          Delete
        </button>
      </div>
    </div>
  );
}
