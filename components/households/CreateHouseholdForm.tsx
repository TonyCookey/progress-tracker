"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";

type FormValues = {
  name: string;
  address: string;
  primaryContactName: string;
  primaryContactPhone: string;
  baseId: string;
};

export default function CreateHouseholdForm({ bases, onClose }: { bases: any[]; onClose: () => void }) {
  const { register, handleSubmit } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, baseId: data.baseId || null }),
      });

      if (res.ok) {
        onClose();
      } else {
        const text = await res.text();
        alert(`Failed to create household: ${text}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Name</label>
        <input {...register("name", { required: true })} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Base</label>
        <select {...register("baseId")} className="w-full border p-2 rounded">
          <option value="">No base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Address</label>
        <input {...register("address")} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Primary Contact Name</label>
        <input {...register("primaryContactName")} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Primary Contact Phone</label>
        <input {...register("primaryContactPhone")} className="w-full border p-2 rounded" />
      </div>

      <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
