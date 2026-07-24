"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import EditActivityForm from "@/components/activities/EditActivityForm";
import Button from "@/components/ui/Button";

export default function EditActivityPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState(null as any);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      const res = await fetch(`/api/activities/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setError(res.status === 404 ? "Activity not found." : "Failed to load activity.");
        return;
      }
      setActivity(await res.json());
    }
    fetchActivity();
  }, [id]);

  if (error) {
    return (
      <div className="px-5 space-y-4">
        <p className="text-danger-500">{error}</p>
        <Button variant="secondary" onClick={() => router.push("/dashboard/activities")}>
          Back to Activities
        </Button>
      </div>
    );
  }

  if (!activity) return <LoadingSpinner />;

  return (
    <div className="px-5 space-y-5">
      <EditActivityForm activity={activity} />
    </div>
  );
}
