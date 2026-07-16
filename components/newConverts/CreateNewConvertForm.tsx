"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type FormData = {
  name: string;
  gender: string;
  phone: string;
  dateOfBirth: string;
  baseId: string;
  date: string;
  invitedBy: string;
  followedUp: boolean;
  becameTeen: boolean;
  notes: string;
};

type Option = { id: string; name: string };

export default function CreateNewConvertForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { baseId: session?.user?.baseId ?? "" },
  });
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
  }, [isSuperAdmin]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/new-converts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, baseId: isSuperAdmin ? data.baseId : session?.user?.baseId }),
      });
      if (!res.ok) {
        const text = await res.text();
        toast.error(`Failed to create new convert: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      toast.success("New convert created successfully");
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Full Name" {...register("name", { required: true })} error={errors.name && "This field is required"} />

        <Select label="Gender" {...register("gender")}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>

        <Input label="Phone" {...register("phone")} />

        <Input label="Date of Birth" type="date" {...register("dateOfBirth")} />

        <Input
          label="Date (came/converted)"
          type="date"
          {...register("date", { required: true })}
          error={errors.date && "This field is required"}
        />

        {isSuperAdmin && (
          <Select label="Base" {...register("baseId", { required: true })} error={errors.baseId && "This field is required"}>
            <option value="">Select a base</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </Select>
        )}

        <Input label="Invited By" {...register("invitedBy")} />

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("followedUp")} id="followedUp" className="h-4 w-4 rounded accent-accent-500" />
          <label htmlFor="followedUp" className="text-sm font-medium">
            Followed Up
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("becameTeen")} id="becameTeen" className="h-4 w-4 rounded accent-accent-500" />
          <label htmlFor="becameTeen" className="text-sm font-medium">
            Became a Teen
          </label>
        </div>

        <div className="md:col-span-2">
          <Textarea label="Notes" {...register("notes")} rows={3} />
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        {loading ? "Creating..." : "Create New Convert"}
      </Button>
    </form>
  );
}
