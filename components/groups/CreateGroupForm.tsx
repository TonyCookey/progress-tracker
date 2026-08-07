"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type FormValues = {
  name: string;
  description: string;
  baseId: string;
  leaderId: string;
  supportIds: string[];
};

export default function CreateGroupForm({ bases, leaders, type, onClose }: { bases: any[]; leaders: any[]; type: string; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const selectedBaseId = watch("baseId");
  // Only generals from the chosen base can lead/support it (enforced server-side too) —
  // scope the dropdowns so a mismatched pick can't be made in the first place.
  const baseLeaders = selectedBaseId ? leaders.filter((l) => l.baseId === selectedBaseId) : leaders;

  useEffect(() => {
    setValue("leaderId", "");
    setValue("supportIds", []);
  }, [selectedBaseId, setValue]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type }),
      });

      if (res.ok) {
        toast.success("Created successfully");
        onClose();
      } else {
        toast.error("Failed to Create");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Name" {...register("name", { required: true })} error={errors.name && "Name is required"} />

      <Textarea label="Description" {...register("description", { required: true })} error={errors.description && "Description is required"} />

      <Select label="Base" {...register("baseId", { required: true })} error={errors.baseId && "Base is required"}>
        {bases.map((base) => (
          <option key={base.id} value={base.id}>
            {base.name}
          </option>
        ))}
      </Select>

      <Select label="General In Charge" {...register("leaderId", { required: true })} error={errors.leaderId && "Leader is required"} defaultValue="">
        <option value="" disabled>
          Select General
        </option>
        {baseLeaders.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>
      <Select label="Supporting Members" multiple {...register("supportIds")}>
        {baseLeaders.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>

      <Button type="submit" disabled={loading} isLoading={loading} className="w-full">
        {loading ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
