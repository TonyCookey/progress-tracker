"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

type FormValues = {
  name: string;
  address: string;
  primaryContactName: string;
  primaryContactPhone: string;
  baseId: string;
};

export default function CreateHouseholdForm({ bases, onClose }: { bases: any[]; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
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
      <Input label="Name" {...register("name", { required: true })} error={errors.name && "Name is required"} />

      <Select label="Base" {...register("baseId")}>
        <option value="">No base</option>
        {bases.map((base) => (
          <option key={base.id} value={base.id}>
            {base.name}
          </option>
        ))}
      </Select>

      <Input label="Address" {...register("address")} />

      <Input label="Primary Contact Name" {...register("primaryContactName")} />

      <Input label="Primary Contact Phone" {...register("primaryContactPhone")} />

      <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
        {loading ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
