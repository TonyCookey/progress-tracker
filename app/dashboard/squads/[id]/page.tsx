"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Squad = {
  id: string;
  name: string;
  description: string | null;
  base: { id: string; name: string } | null;
  leader: { id: string; name: string } | null;
  activities: { id: string; title: string; date: string }[] | null;
  members: { id: string; teen: { id: string; name: string } }[] | null;
};

export default function SquadDetailsPage() {
  const { id } = useParams();
  const [squad, setSquad] = useState(null as Squad | null);

  useEffect(() => {
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
      console.log("Fetched squad data:", data);

      setSquad(data);
    }
    fetchSquad();
  }, [id]);

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
                      <span className="font-semibold text-cyan-900">{activity.title}</span>
                      <span className="text-xs text-gray-500">{activity.date}</span>
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
