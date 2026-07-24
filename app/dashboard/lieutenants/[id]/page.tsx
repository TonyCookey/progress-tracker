"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { calculateAge } from "@/lib/calculateAge";
import { formatDate } from "@/lib/formatDate";
import PersonAvatar from "@/components/ui/PersonAvatar";
import EditLieutenantModal from "@/components/lieutenants/EditLieutenantsModal";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StatTile from "@/components/charts/StatTile";
import { formatDateUTC } from "@/lib/formatDate";
import { getNextBirthday } from "@/lib/getNextBirthday";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import type { BadgeTone } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
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
      toast.error("Failed to delete lieutenant");
      return;
    }
    toast.success("Lieutenant deleted successfully");
    setTimeout(() => (window.location.href = "/dashboard/lieutenants"), 800);
  };

  if (!teen) return <LoadingSpinner />;

  const color = getColorClasses(teen.gender);
  const statusTone: BadgeTone = teen.status === "LEFT" ? "neutral" : teen.status === "INACTIVE" ? "warning" : "success";

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Profile Card */}
        <Card className={`flex-1 ${color.gradient} flex items-center gap-6`}>
          {teen.imageKey ? (
            <PersonAvatar imageKey={teen.imageKey} alt={`${teen.name}'s profile`} size={80} />
          ) : (
            <div className={`w-24 h-24 rounded-full ${color.avatar} flex items-center justify-center text-3xl font-bold text-white shadow`}>
              {teen.name?.[0] ?? "?"}
            </div>
          )}
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${color.name}`}>{teen.name}</h2>
            <span className={`inline-block ${color.badge} text-white px-3 py-1 rounded-pill text-sm font-semibold mb-2`}>{teen.rank}</span>
            <p className="text-neutral-700 mb-1">
              <strong className="text-neutral-800">Gender:</strong> {teen.gender}
            </p>
            <p className="text-neutral-700 mb-1">
              <strong className="text-neutral-800">Date of Birth:</strong> {formatDate(teen.dateOfBirth)} ({calculateAge(teen.dateOfBirth)} yrs)
            </p>
          </div>
        </Card>

        {/* Assignments Card */}
        <Card className="flex-1">
          <h3 className={`text-lg font-semibold mb-4 ${color.header}`}>Assignments</h3>
          <div className="space-y-2 text-base">
            <p>
              <strong className="text-neutral-800">Base:</strong> <span className={color.assignment}>{teen.base.name}</span>
            </p>
            <p>
              <strong className="text-neutral-800">Platoon:</strong>{" "}
              <a
                href={teen.platoon ? `/dashboard/platoons/${teen.platoon.id}` : "#"}
                className={color.assignment + (teen.platoon ? " hover:underline" : " text-neutral-500")}
              >
                <span className={color.assignment}>{teen.platoon?.name || "N/A"}</span>
              </a>
            </p>
            <p>
              <strong className="text-neutral-800">Household:</strong>{" "}
              <a
                href={teen.household ? `/dashboard/households/${teen.household.id}` : "#"}
                className={color.assignment + (teen.household ? " hover:underline" : " text-neutral-500")}
              >
                <span className={color.assignment}>{teen.household?.name || "N/A"}</span>
              </a>
            </p>
            <p>
              <strong className="text-neutral-800">Squads:</strong>{" "}
              {teen.squads.length ? (
                <a
                  href={teen.squads ? `/dashboard/squads/${teen.squads.map((s) => s.id).join(",")}` : "#"}
                  className={color.assignment + (teen.squads ? " hover:underline" : " text-neutral-500")}
                >
                  <span className={color.assignment}>{teen.squads.map((s) => s.name).join(", ")}</span>
                </a>
              ) : (
                <span className="text-neutral-500">None</span>
              )}
            </p>
          </div>
        </Card>
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
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${color.header}`}>Pastoral Info</h3>
          <Badge tone={statusTone}>{teen.status ?? "ACTIVE"}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1">
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">Phone:</strong> {teen.phone || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">Address:</strong> {teen.address || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">School:</strong> {teen.school || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">Date Joined:</strong> {teen.dateJoined ? formatDate(teen.dateJoined) : "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">Guardian Name:</strong> {teen.guardianName || "N/A"}
          </p>
          <p className="text-neutral-700 mb-1">
            <strong className="text-neutral-800">Guardian Phone:</strong> {teen.guardianPhone || "N/A"}
          </p>
        </div>
      </Card>

      {/* Siblings (same household) */}
      {teen.household && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${color.header}`}>
              Siblings <span className="text-neutral-500 font-normal text-sm">({teen.household.name})</span>
            </h3>
          </div>
          {teen.siblings?.length ? (
            <ul className="divide-y divide-neutral-100">
              {teen.siblings.map((sibling) => (
                <Link href={`/dashboard/lieutenants/${sibling.id}`} key={sibling.id} className="block hover:bg-accent-50 rounded-lg px-1">
                  <li className="flex items-center gap-4 py-3">
                    <Avatar name={sibling.name ?? "?"} size="sm" />
                    <p className="font-medium text-neutral-900 text-sm">{sibling.name}</p>
                  </li>
                </Link>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500">No other teens in this household.</p>
          )}
        </Card>
      )}

      {/* Attendance */}
      <Card className="mb-8">
        <h3 className={`text-lg font-semibold mb-4 ${color.header}`}>Attendance</h3>
        {teen.attendance.length ? (
          <>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-xs text-neutral-500 mr-2">Recent:</span>
              {teen.attendance.slice(-12).map((a) => (
                <span
                  key={a.activityId}
                  title={`${a.activityName} — ${formatDateUTC(a.date, { month: "short", day: "numeric" })} — ${a.attended ? "Attended" : "Absent"}`}
                  className={`inline-block w-2.5 h-2.5 rounded-full ${a.attended ? "bg-success-500" : "bg-neutral-300"}`}
                />
              ))}
            </div>
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
            <ul className="divide-y divide-neutral-100 mt-4">
              {teen.attendance
                .slice()
                .reverse()
                .map((a) => (
                  <li key={a.activityId} className="flex items-center justify-between py-2">
                    <Link href={`/dashboard/activities/${a.activityId}`} className="text-sm font-medium text-neutral-800 hover:underline">
                      {a.activityName}
                    </Link>
                    <span className="text-xs text-neutral-500">{formatDateUTC(a.date, { month: "short", day: "numeric", year: "numeric" })}</span>
                    <Badge tone={a.attended ? "success" : "danger"} size="sm">
                      {a.attended ? "Attended" : "Absent"}
                    </Badge>
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="text-neutral-500">No attendance records yet.</p>
        )}
      </Card>

      <div className="flex gap-4 justify-end">
        <EditLieutenantModal lieutenant={teen} onSuccess={fetchTeen} />
        <Button variant="danger" onClick={() => handleDelete(teen.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
