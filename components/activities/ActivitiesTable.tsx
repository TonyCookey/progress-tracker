"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import LoadingSpinner from "../common/LoadingSpinner";
import { EyeIcon } from "@heroicons/react/24/outline";

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
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 text-sm text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Type</th>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Cross-base?</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm">
          {activities.map((activity) => (
            <tr key={activity.id}>
              <td className="px-4 py-2">{activity.name}</td>
              <td className="px-4 py-2">{activity.type}</td>
              <td className="px-4 py-2">{format(new Date(activity.date), "do MMM yyyy")}</td>
              <td className="px-4 py-2">{activity.isCrossBase ? "Yes" : "No"}</td>
              {/* <td className="px-4 py-2">{activity.groups.map((g) => g.name).join(", ")}</td> */}
              <td className="px-4 py-2 space-x-2">
                <EyeIcon className="w-5 h-5 text-blue-600" />
                {/* <button className="text-yellow-600 hover:underline">Edit</button> */}
                {/* <button className="text-red-600 hover:underline">Delete</button> */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
