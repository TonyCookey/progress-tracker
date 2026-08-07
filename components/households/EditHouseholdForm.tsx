"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

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
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: household.name || "",
      address: household.address || "",
      primaryContactName: household.primaryContactName || "",
      primaryContactPhone: household.primaryContactPhone || "",
      baseId: household.baseId || "",
    },
  });
  const toast = useToast();
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
        toast.error(`Failed to update household: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      toast.success("Household updated successfully");
      onSuccess();
    } catch (err) {
      toast.error("Failed to update household");
      console.error("Failed to update household", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Name" {...register("name", { required: true })} error={errors.name && "Name is required"} />

        <Select label="Base" {...register("baseId")}>
          <option value="">No base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </Select>

        <div className="md:col-span-2">
          <Input label="Address" {...register("address")} />
        </div>

        <Input label="Primary Contact Name" {...register("primaryContactName")} />

        <Input label="Primary Contact Phone" {...register("primaryContactPhone")} />
      </div>

      <Button type="submit" className="w-full mt-4" disabled={loading} isLoading={loading}>
        {loading ? "Updating..." : "Update Household"}
      </Button>
    </form>
  );
}
