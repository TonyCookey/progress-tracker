"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

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

type NewConvert = {
  id: string;
  name: string;
  gender: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  baseId: string | null;
  date: string;
  invitedBy: string | null;
  followedUp: boolean;
  becameTeen: boolean;
  notes: string | null;
};

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export default function EditNewConvertForm({ newConvert, onSuccess }: { newConvert: NewConvert; onSuccess: () => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      name: newConvert.name,
      gender: newConvert.gender ?? "",
      phone: newConvert.phone ?? "",
      dateOfBirth: toDateInput(newConvert.dateOfBirth),
      baseId: newConvert.baseId ?? "",
      date: toDateInput(newConvert.date),
      invitedBy: newConvert.invitedBy ?? "",
      followedUp: newConvert.followedUp,
      becameTeen: newConvert.becameTeen,
      notes: newConvert.notes ?? "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
  }, [isSuperAdmin]);

  useSyncSelectValue(bases, setValue, "baseId", newConvert.baseId ?? "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/new-converts/${newConvert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, baseId: isSuperAdmin ? data.baseId : newConvert.baseId }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update new convert: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      onSuccess();
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
          <label className="block text-sm font-medium mb-2">Gender</label>
          <select {...register("gender")} className="w-full border px-3 py-2 rounded">
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input {...register("phone")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth</label>
          <input type="date" {...register("dateOfBirth")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date (came/converted)</label>
          <input type="date" {...register("date", { required: true })} className="w-full border px-3 py-2 rounded" />
        </div>

        {isSuperAdmin && (
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
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Invited By</label>
          <input {...register("invitedBy")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("followedUp")} id="edit-followedUp" className="h-4 w-4" />
          <label htmlFor="edit-followedUp" className="text-sm font-medium">
            Followed Up
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("becameTeen")} id="edit-becameTeen" className="h-4 w-4" />
          <label htmlFor="edit-becameTeen" className="text-sm font-medium">
            Became a Teen
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Notes</label>
          <textarea {...register("notes")} className="w-full border px-3 py-2 rounded" rows={3} />
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Updating..." : "Update New Convert"}
      </button>
    </form>
  );
}
