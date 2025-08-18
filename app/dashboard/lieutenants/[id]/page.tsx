"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { calculateAge } from "@/lib/calculateAge";

type Teen = {
  id: string;
  name: string;
  rank: string;
  gender: string;
  dateOfBirth: string;
  base: { id: string; name: string };
  platoon?: { id: string; name: string };
  squads: { id: string; name: string }[];
};

export default function TeenDetailsPage() {
  const { id } = useParams();
  const [teen, setTeen] = useState(null as Teen | null);

  useEffect(() => {
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
      setTeen(data);
    }
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

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-lg p-8 mb-8 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-blue-300 flex items-center justify-center text-4xl font-bold text-white shadow">{teen.name?.[0] ?? "?"}</div>
        <div>
          <h2 className="text-3xl font-bold mb-2 text-blue-900">{teen.name}</h2>
          <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">{teen.rank}</span>
          <p className="text-gray-700 mb-1">
            <strong>Gender:</strong> {teen.gender}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Date of Birth:</strong> {formatDate(teen.dateOfBirth)} ({calculateAge(teen.dateOfBirth)} yrs)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-800">Assignments</h3>
        <div className="space-y-2 text-lg">
          <p>
            <strong>Base:</strong> <span className="text-blue-700">{teen.base.name}</span>
          </p>
          <p>
            <strong>Platoon:</strong> <span className="text-blue-700">{teen.platoon?.name || "N/A"}</span>
          </p>
          <p>
            <strong>Squads:</strong>{" "}
            {teen.squads.length ? (
              <span className="text-blue-700">{teen.squads.map((s) => s.name).join(", ")}</span>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow">Edit</button>
        <button onClick={() => handleDelete(teen.id)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
          Delete
        </button>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}
