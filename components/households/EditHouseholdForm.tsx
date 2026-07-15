"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

type FormData = {
  name: string;
  address: string;
  primaryContactName: string;
  primaryContactPhone: string;
  baseId: string;
};

type Option = { id: string; name: string };

type Household = FormData & { id: string };

export default function EditHouseholdForm({ household, onSuccess }: { household: Household; onSuccess: () => void }) {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      name: household.name || "",
      address: household.address || "",
      primaryContactName: household.primaryContactName || "",
      primaryContactPhone: household.primaryContactPhone || "",
      baseId: household.baseId || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);

  useEffect(() => {
    setValue("name", household.name || "");
    setValue("address", household.address || "");
    setValue("primaryContactName", household.primaryContactName || "");
    setValue("primaryContactPhone", household.primaryContactPhone || "");
    setValue("baseId", household.baseId || "");
  }, [household, setValue]);

  useEffect(() => {
    fetch("/api/bases")
      .then((res) => res.json())
      .then(setBases);
  }, []);

  useSyncSelectValue(bases, setValue, "baseId", household.baseId || "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/households/${household.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, baseId: data.baseId || null }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update household: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      onSuccess();
    } catch (err) {
      alert("Failed to update household");
      console.error("Failed to update household", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input {...register("name", { required: true })} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Base</label>
          <select {...register("baseId")} className="w-full border px-3 py-2 rounded">
            <option value="">No base</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Address</label>
          <input {...register("address")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Primary Contact Name</label>
          <input {...register("primaryContactName")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Primary Contact Phone</label>
          <input {...register("primaryContactPhone")} className="w-full border px-3 py-2 rounded" />
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Updating..." : "Update Household"}
      </button>
    </form>
  );
}
