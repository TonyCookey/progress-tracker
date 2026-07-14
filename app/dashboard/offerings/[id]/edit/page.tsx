"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RecordOfferingForm from "@/components/offerings/RecordOfferingForm";

export default function EditOfferingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [offering, setOffering] = useState(null as any);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffering() {
      const res = await fetch(`/api/offerings/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setError(res.status === 404 ? "Offering not found." : "Failed to load offering.");
        return;
      }
      setOffering(await res.json());
    }
    fetchOffering();
  }, [id]);

  if (error) {
    return (
      <div className="px-5 space-y-4">
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.push("/dashboard/offerings")} className="text-cyan-700 hover:underline">
          Back to Offerings
        </button>
      </div>
    );
  }

  if (!offering) return <LoadingSpinner />;

  return (
    <div className="px-5 space-y-5">
      <RecordOfferingForm offering={offering} />
    </div>
  );
}
