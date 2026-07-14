"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

type FormData = {
  name: string;
  username: string;
  email: string;
  gender: string;
  dateOfBirth: string;
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
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <input {...register("name", { required: true })} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input {...register("username", { required: true })} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input type="email" {...register("email", { required: true })} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <select {...register("gender")} className="w-full border px-3 py-2 rounded">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth</label>
          <input type="date" {...register("dateOfBirth")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Base</label>
          <select {...register("baseId", { required: true })} className="w-full border px-3 py-2 rounded">
            <option value="">Select a base</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Role</label>
          <select {...register("role", { required: true })} className="w-full border px-3 py-2 rounded">
            <option value="SUPERADMIN">Super Admin</option>
            <option value="GENERAL">General</option>
            <option value="COLONEL">Colonel</option>
            <option value="VOLUNTEER">Volunteer</option>
          </select>
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Updating..." : "Update General"}
      </button>
    </form>
  );
}
