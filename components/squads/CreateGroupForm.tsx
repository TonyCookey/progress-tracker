"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type FormValues = {
  name: string;
  description: string;
  baseId: string;
  leaderId: string;
};

export default function CreateGroupForm({ bases, leaders, type, onClose }: { bases: any[]; leaders: any[]; type: string; onClose: () => void }) {
  const { register, handleSubmit } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type }),
      });

      if (res.ok) {
        onClose();
      } else {
        alert("Failed to Create");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium"> Name</label>
        <input {...register("name", { required: true })} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea {...register("description", { required: true })} className="w-full border p-2 rounded" />
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
        <label className="block text-sm font-medium">General In Charge</label>
        <select {...register("leaderId", { required: true })} className="w-full border p-2 rounded">
          <option value="" disabled selected>
            Select General
          </option>
          {leaders.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Supporting Members</label>
        <select
          // {...register("leaderId", { required: true })}
          className="w-full border p-2 rounded"
        >
          <option value="" disabled selected>
            Select Supporting Generals
          </option>
          {leaders.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
