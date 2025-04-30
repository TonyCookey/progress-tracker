"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type FormValues = {
  name: string;
  baseId: string;
  leaderId: string;
};

export default function CreateSquadForm({ bases, leaders, onClose }: { bases: any[]; leaders: any[]; onClose: () => void }) {
  const { register, handleSubmit } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: "SQUAD" }),
      });

      if (res.ok) {
        onClose();
      } else {
        alert("Failed to create squad");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Squad Name</label>
        <input {...register("name", { required: true })} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Base</label>
        <select {...register("baseId", { required: true })} className="w-full border p-2 rounded">
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Leader</label>
        <select {...register("leaderId", { required: true })} className="w-full border p-2 rounded">
          {leaders.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Creating..." : "Create Squad"}
      </button>
    </form>
  );
}
