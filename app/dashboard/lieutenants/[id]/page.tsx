"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { calculateAge } from "@/lib/calculateAge";
import EditLieutenantForm from "@/components/lieutenants/EditLieutenantsForm";

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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function fetchTeen() {
      const res = await fetch(`/api/teens/${id}`, { cache: "no-store" });
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

    const res = await fetch(`/api/teens/${teenId}`, {
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
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">{teen.name}'s Profile</h2>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Rank:</strong> {teen.rank}
        </p>
        <p>
          <strong>Gender:</strong> {teen.gender}
        </p>
        <p>
          <strong>Date of Birth:</strong> {formatDate(teen.dateOfBirth)} ({calculateAge(teen.dateOfBirth)} years old)
        </p>
        <p>
          <strong>Base:</strong> {teen.base.name}
        </p>
        <p>
          <strong>Platoon:</strong> {teen.platoon?.name || "N/A"}
        </p>
        <p>
          <strong>Squads:</strong> {teen.squads.map((s) => s.name).join(", ") || "None"}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
          Edit
        </button>
        <button onClick={() => handleDelete(teen.id)} className="bg-red-600 text-white px-4 py-2 rounded">
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
