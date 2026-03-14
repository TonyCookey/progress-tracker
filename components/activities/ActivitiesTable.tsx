"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import LoadingSpinner from "../common/LoadingSpinner";
import { EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
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
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto border rounded-xl shadow bg-white">
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
                <td className="px-4 py-3 font-medium text-sm">{activity.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block bg-cyan-100 text-cyan-900 px-2 py-1 rounded-full text-xs font-semibold">{activity.type}</span>
                </td>
                <td className="px-4 py-3 text-sm">{format(new Date(activity.date), "do MMM yyyy")}</td>
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
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="border rounded-xl shadow bg-white p-4 flex flex-col gap-2">
            <div className="mb-2">
              <span className="inline-block bg-cyan-100 text-cyan-900 px-2 py-1 rounded-full text-xs font-semibold mb-1">{activity.type}</span>
              <span className="block font-medium text-base break-words leading-snug mt-3 mb-1">{activity.name}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-semibold">Date:</span> {format(new Date(activity.date), "do MMM yyyy")}
              </div>
              <div>
                <span className="font-semibold">Cross-base:</span>{" "}
                {activity.isCrossBase ? (
                  <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold ml-1">Yes</span>
                ) : (
                  <span className="inline-block bg-orange-200 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold ml-1">No</span>
                )}
              </div>
            </div>
            <div className="flex mt-2 justify-end">
              <Link href={`/dashboard/activities/${activity.id}`} title="View" className="p-2 rounded hover:bg-blue-100 transition">
                <ArrowRightIcon className="w-5 h-5 text-blue-600" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
