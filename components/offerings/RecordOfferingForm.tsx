"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { id: string; name: string };
type SquadOption = {
  value: string;
  label: string;
};
export default function RecordOfferingForm() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm();
  const router = useRouter();

  const [bases, setBases] = useState<Option[]>([]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      const data = await res.json();
      console.log(data, "Fetched bases data");
      setBases(data);
    };

    fetchBases();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      if (data.baseId === "cross-base") {
        data.baseId = null;
        data.isCrossBase = true;
      }
      const res = await fetch("/api/offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error("Failed to create offering", res.statusText);
        alert("Failed to create offering");
      }
      reset();
      router.push("/dashboard/offerings");
    } catch (error) {
      console.error("Failed to create offering:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-10 bg-white rounded shadow-md">
      <h1 className="text-xl font-semibold">Record Offering</h1>
      <div>
        <label htmlFor="service" className="block text-sm font-medium">
          Service
        </label>
        <input id="service" {...register("service", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium">
          Amount
        </label>
        <input id="amount" {...register("amount", { required: true })} type="number" className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea id="notes" {...register("notes")} className="w-full border rounded px-3 py-2 mt-1" rows={3} />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium">
          Date
        </label>
        <input type="date" id="date" {...register("date", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Type
        </label>
        <select id="type" {...register("type")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="Cash">Cash</option>
          <option value="Online">Online/Transfer</option>
        </select>
      </div>

      <div>
        <label htmlFor="baseId" className="block text-sm font-medium">
          Base
        </label>
        <select id="baseId" {...register("baseId")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="">Select a Base</option>
          <option value="cross-base">Cross Base</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting} className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700">
          {isSubmitting ? "Recording..." : "Record Offering"}
        </button>
      </div>
    </form>
  );
}
