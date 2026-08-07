"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RecordOfferingForm from "@/components/offerings/RecordOfferingForm";
import Button from "@/components/ui/Button";

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
        <p className="text-danger-500">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard/offerings")}>
          Back to Offerings
        </Button>
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
