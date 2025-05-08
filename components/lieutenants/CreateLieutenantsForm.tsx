"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
};
type Base = {
  id: string;
  name: string;
};

export default function CreateLieutenantForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();

  const { register, handleSubmit, reset } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      const data = await res.json();
      setBases(data);
    };

    fetchBases();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lieutenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rank: "LIEUTENANT" }),
      });
      if (!res.ok) {
        console.error("Failed to create lieutenant", res.statusText);
        alert("Failed to create lieutenant");
      }
      reset();
      onSuccess();
    } catch (err) {
      console.error("Failed to create lieutenant", err);
    } finally {
      setLoading(false);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input {...register("name", { required: true })} className="w-full border px-3 py-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Gender</label>
        <select {...register("gender")} className="w-full border px-3 py-2 rounded">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Date of Birth</label>
        <input type="date" {...register("dateOfBirth", { required: true })} className="w-full border px-3 py-2 rounded" />
      </div>

      <div>
        <label className="block text-sm mb-1">Base</label>
        <select {...register("baseId", { required: true })} className="w-full border px-3 py-2 rounded">
          <option value="">Select a base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Lieutenant"}
      </button>
    </form>
  );
}
