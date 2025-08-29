"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import LoadingSpinner from "../common/LoadingSpinner";
import { EyeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type Activity = {
  id: string;
  name: string;
  type: string;
  date: string;
  isCrossBase: boolean;
  base?: { name: string };
  groups: { id: string; name: string }[];
};

export default function ActivitiesTable() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
      setLoading(false);
    }

    fetchActivities();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="overflow-x-auto border rounded-xl shadow bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-50 text-sm">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Name</th>
            <th className="px-4 py-3 text-left font-semibold">Type</th>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Cross-base?</th>
            <th className="px-4 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, idx) => (
            <tr key={activity.id} className={`transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
              <td className="px-4 py-3 font-medium">{activity.name}</td>
              <td className="px-4 py-3">
                <span className="inline-block bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full text-xs font-semibold">{activity.type}</span>
              </td>
              <td className="px-4 py-3">{format(new Date(activity.date), "do MMM yyyy")}</td>
              <td className="px-4 py-3">
                {activity.isCrossBase ? (
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">Yes</span>
                ) : (
                  <span className="inline-block bg-orange-200 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">No</span>
                )}
              </td>
              <td className="px-4 py-3 flex items-center space-x-2">
                <Link href={`/dashboard/activities/${activity.id}`}>
                  <EyeIcon className="w-5 h-5 text-blue-600" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
