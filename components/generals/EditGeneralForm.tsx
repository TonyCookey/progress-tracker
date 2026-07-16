"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

type FormData = {
  name: string;
  username: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  anniversaryDate: string;
  baseId: string;
  role: string;
};

type Base = { id: string; name: string };

type General = FormData & { id: string };

export default function EditGeneralForm({ general, onSuccess }: { general: General; onSuccess: () => void }) {
  const { register, handleSubmit, reset, setValue } = useForm<FormData>({
    defaultValues: {
      name: general.name || "",
      username: general.username || "",
      email: general.email || "",
      gender: general.gender || "Male",
      dateOfBirth: general.dateOfBirth ? new Date(general.dateOfBirth).toISOString().slice(0, 10) : "",
      anniversaryDate: general.anniversaryDate ? new Date(general.anniversaryDate).toISOString().slice(0, 10) : "",
      baseId: general.baseId || "",
      role: general.role || "GENERAL",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);

  useEffect(() => {
    setValue("name", general.name || "");
    setValue("username", general.username || "");
    setValue("email", general.email || "");
    setValue("gender", general.gender || "Male");
    setValue("dateOfBirth", general.dateOfBirth ? new Date(general.dateOfBirth).toISOString().slice(0, 10) : "");
    setValue("anniversaryDate", general.anniversaryDate ? new Date(general.anniversaryDate).toISOString().slice(0, 10) : "");
    setValue("baseId", general.baseId || "");
    setValue("role", general.role || "GENERAL");
  }, [general, setValue]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      const data = await res.json();
      setBases(data);
    };
    fetchBases();
  }, []);

  useSyncSelectValue(bases, setValue, "baseId", general.baseId || "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/generals/${general.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update general: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      onSuccess();
    } catch (err) {
      alert("Failed to update general");
      console.error("Failed to update general", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Full Name" {...register("name", { required: true })} />

        <Input label="Username" {...register("username", { required: true })} />

        <Input label="Email" type="email" {...register("email", { required: true })} />

        <Select label="Gender" {...register("gender")}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>

        <Input label="Date of Birth" type="date" {...register("dateOfBirth")} />

        <Input label="Anniversary Date" type="date" {...register("anniversaryDate")} />

        <Select label="Base" {...register("baseId", { required: true })}>
          <option value="">Select a base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </Select>

        <Select label="Role" {...register("role", { required: true })}>
          <option value="SUPERADMIN">Super Admin</option>
          <option value="GENERAL">General</option>
          <option value="COLONEL">Colonel</option>
          <option value="VOLUNTEER">Volunteer</option>
        </Select>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        {loading ? "Updating..." : "Update General"}
      </Button>
    </form>
  );
}
