"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RecordOfferingForm from "@/components/offerings/RecordOfferingForm";

export default function EditOfferingPage() {
  const { id } = useParams();
  const [offering, setOffering] = useState(null as any);

  useEffect(() => {
    async function fetchOffering() {
      const res = await fetch(`/api/offerings/${id}`, { cache: "no-store" });
      if (!res.ok) {
        console.error("Failed to fetch offering");
        return;
      }
      setOffering(await res.json());
    }
    fetchOffering();
  }, [id]);

  if (!offering) return <LoadingSpinner />;

  return (
    <div className="px-5 space-y-5">
      <RecordOfferingForm offering={offering} />
    </div>
  );
}
