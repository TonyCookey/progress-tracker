"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import UiSelect from "@/components/ui/Select";
import Button from "@/components/ui/Button";

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
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h1 className="text-lg font-semibold">{isEdit ? "Edit Offering" : "Record Offering"}</h1>
        <Input id="service" label="Service" {...register("service", { required: true })} error={errors.service && "Service is required."} />
        <Input
          id="amount"
          type="number"
          label="Amount"
          {...register("amount", { required: true })}
          error={errors.amount && "Amount is required."}
        />

        <Textarea id="notes" label="Notes" {...register("notes")} rows={3} />

        <Input id="date" type="date" label="Date" {...register("date", { required: true })} error={errors.date && "Date is required."} />

        <UiSelect id="type" label="Type" {...register("type", { required: true })} error={errors.type && "Please select a type."}>
          <option value="" disabled>
            Select a type
          </option>
          {offeringTypes.map((t) => (
            <option key={t.id} value={t.key}>
              {t.label}
              {!t.active ? " (inactive)" : ""}
            </option>
          ))}
        </UiSelect>

        <UiSelect id="baseId" label="Base" {...register("baseId")}>
          <option value="">Select a Base</option>
          <option value="cross-base">Cross Base</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </UiSelect>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            {isSubmitting ? (isEdit ? "Updating..." : "Recording...") : isEdit ? "Update Offering" : "Record Offering"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
