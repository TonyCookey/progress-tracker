"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";

type General = {
  id: string;
  name: string;
  role: string;
  gender: string;
  dateOfBirth: string;
  base: { id: string; name: string };
  leadingGroups?: { id: string; name: string }[];
  supportingGroups?: { id: string; name: string }[];
};

export default function GeneralDetailsPage() {
  const { id } = useParams();
  const [general, setGeneral] = useState(null as General | null);

  useEffect(() => {
    async function fetchGeneral() {
      const res = await fetch(`/api/generals/${id}`, { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch general data");
        return;
      }
      const data = await res.json();
      console.log("Fetched general data:", data);

      if (!data) {
        console.error("No data found");
        return;
      }
      setGeneral(data);
    }
    fetchGeneral();
  }, [id]);

  const handleDelete = async (generalId: string) => {
    if (!confirm("Are you sure you want to delete this general?")) return;

    const res = await fetch(`/api/generals/${generalId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete general");
      return;
    }
    alert("General deleted successfully");
    window.location.href = "/dashboard/generals";
  };

  if (!general) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-lg p-8 mb-8 flex items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-green-300 flex items-center justify-center text-4xl font-bold text-white shadow">
          {general.name?.[0] ?? "?"}
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2 text-green-900">{general.name}</h2>
          <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">{general.role}</span>
          <p className="text-gray-700 mb-1">
            <strong>Gender:</strong> {general.gender}
          </p>
          <p className="text-gray-700 mb-1">
            <strong>Date of Birth:</strong> {formatDate(general.dateOfBirth)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4 text-green-800">Assignments</h3>
        <div className="space-y-2 text-lg">
          <p>
            <strong>Base:</strong> <span className="text-green-700">{general.base.name}</span>
          </p>
          <p>
            <strong>Leading Groups:</strong> <span className="text-green-700">{general.leadingGroups?.map((g) => g.name).join(", ") || "N/A"}</span>
          </p>
          <p>
            <strong>Supporting Groups:</strong>{" "}
            {general.supportingGroups?.length ? (
              <span className="text-green-700">{general.supportingGroups.map((s) => s.name).join(", ")}</span>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow">Edit</button>
        <button onClick={() => handleDelete(general.id)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
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
