"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

type Option = { id: string; name: string };
type SquadOption = {
  value: string;
  label: string;
};
type RefDataOption = { id: string; key: string; label: string; active: boolean };

type Offering = {
  id: string;
  service: string;
  amount: number | string;
  date: string;
  notes?: string | null;
  type?: string | null;
  baseId?: string | null;
  isCrossBase?: boolean;
};

export default function RecordOfferingForm({ offering }: { offering?: Offering }) {
  const isEdit = !!offering;
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      service: offering?.service ?? "",
      amount: offering?.amount ?? "",
      date: offering?.date ? new Date(offering.date).toISOString().slice(0, 10) : "",
      notes: offering?.notes ?? "",
      type: offering?.type ?? "",
      baseId: offering?.isCrossBase ? "cross-base" : offering?.baseId ?? "",
    },
  });
  const router = useRouter();

  const [bases, setBases] = useState<Option[]>([]);
  const [offeringTypes, setOfferingTypes] = useState<RefDataOption[]>([]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      const data = await res.json();
      setBases(data);
    };
    const fetchOfferingTypes = async () => {
      const res = await fetch(`/api/refdata?category=offering_type${isEdit ? "&includeInactive=true" : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setOfferingTypes(data);
    };

    fetchBases();
    fetchOfferingTypes();
  }, []);

  useSyncSelectValue(bases, setValue, "baseId", offering?.isCrossBase ? "cross-base" : offering?.baseId ?? "");
  useSyncSelectValue(offeringTypes, setValue, "type", offering?.type ?? "");

  const onSubmit = async (data: any) => {
    try {
      if (data.baseId === "cross-base") {
        data.baseId = null;
        data.isCrossBase = true;
      }
      const res = await fetch(isEdit ? `/api/offerings/${offering!.id}` : "/api/offerings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.error(`Failed to ${isEdit ? "update" : "create"} offering`, res);
        alert(`Failed to ${isEdit ? "update" : "create"} offering`);
        return;
      }
      reset();
      router.push("/dashboard/offerings");
    } catch (error) {
      console.error(`Failed to ${isEdit ? "update" : "create"} offering:`, error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-10 bg-white rounded shadow-md">
      <h1 className="text-xl font-semibold">{isEdit ? "Edit Offering" : "Record Offering"}</h1>
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
        <select id="type" {...register("type", { required: true })} className="w-full border rounded px-3 py-2 mt-1">
          <option value="" disabled>
            Select a type
          </option>
          {offeringTypes.map((t) => (
            <option key={t.id} value={t.key}>
              {t.label}
              {!t.active ? " (inactive)" : ""}
            </option>
          ))}
        </select>
        {errors.type && <p className="text-sm text-red-600 mt-1">Please select a type.</p>}
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
          {isSubmitting ? (isEdit ? "Updating..." : "Recording...") : isEdit ? "Update Offering" : "Record Offering"}
        </button>
      </div>
    </form>
  );
}
