"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export type FirstTimer = {
  id: string;
  name: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  dateOfBirth: string | null;
  school: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  baseId: string;
  base?: { id: string; name: string } | null;
  visitDate: string;
  invitedBy: string | null;
  howHeard: string | null;
  followedUp: boolean;
  returned: boolean;
  notes: string | null;
};

type FormData = {
  name: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  dateOfBirth: string;
  school: string;
  guardianName: string;
  guardianPhone: string;
  baseId: string;
  visitDate: string;
  invitedBy: string;
  howHeard: string;
  followedUp: boolean;
  returned: boolean;
  notes: string;
};

const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");

export default function FirstTimerForm({ firstTimer, onSuccess }: { firstTimer?: FirstTimer; onSuccess: () => void }) {
  const isEdit = !!firstTimer;
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: firstTimer?.name ?? "",
      gender: firstTimer?.gender ?? "",
      phone: firstTimer?.phone ?? "",
      email: firstTimer?.email ?? "",
      address: firstTimer?.address ?? "",
      dateOfBirth: toDateInput(firstTimer?.dateOfBirth),
      school: firstTimer?.school ?? "",
      guardianName: firstTimer?.guardianName ?? "",
      guardianPhone: firstTimer?.guardianPhone ?? "",
      baseId: firstTimer?.baseId ?? session?.user?.baseId ?? "",
      visitDate: toDateInput(firstTimer?.visitDate) || new Date().toISOString().slice(0, 10),
      invitedBy: firstTimer?.invitedBy ?? "",
      howHeard: firstTimer?.howHeard ?? "",
      followedUp: firstTimer?.followedUp ?? false,
      returned: firstTimer?.returned ?? false,
      notes: firstTimer?.notes ?? "",
    },
  });

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch("/api/bases")
      .then((res) => res.json())
      .then((list) => {
        setBases(list);
        // Re-apply the base once options exist so the <select> shows the current value.
        if (firstTimer?.baseId) reset((vals) => ({ ...vals, baseId: firstTimer.baseId }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/first-timers/${firstTimer!.id}` : "/api/first-timers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, baseId: isSuperAdmin ? data.baseId : session?.user?.baseId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? `Failed to save first timer (${res.status})`);
        return;
      }
      toast.success(isEdit ? "First timer updated" : "First timer added");
      if (!isEdit) reset();
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
        <Input label="Email" type="email" {...register("email")} />
        <Input label="Date of Birth" type="date" {...register("dateOfBirth")} />
        <Input label="School" {...register("school")} />
        <Input label="Guardian Name" {...register("guardianName")} />
        <Input label="Guardian Phone" {...register("guardianPhone")} />

        <div className="md:col-span-2">
          <Input label="Address" {...register("address")} />
        </div>

        <Input
          label="Visit Date"
          type="date"
          {...register("visitDate", { required: true })}
          error={errors.visitDate && "This field is required"}
        />

        {isSuperAdmin && (
          <Select label="Base" {...register("baseId", { required: true })} error={errors.baseId && "This field is required"}>
            <option value="">Select a base</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}

        <Input label="Invited By" {...register("invitedBy")} />

        <Select label="How did they hear about us?" {...register("howHeard")}>
          <option value="">Select</option>
          <option value="Invited by a friend">Invited by a friend</option>
          <option value="Family">Family</option>
          <option value="Social media">Social media</option>
          <option value="Outreach">Outreach</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Other">Other</option>
        </Select>

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("followedUp")} id="ft-followedUp" className="h-4 w-4 rounded accent-accent-500" />
          <label htmlFor="ft-followedUp" className="text-sm font-medium">
            Followed Up
          </label>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" {...register("returned")} id="ft-returned" className="h-4 w-4 rounded accent-accent-500" />
          <label htmlFor="ft-returned" className="text-sm font-medium">
            Has Returned (came again)
          </label>
        </div>

        <div className="md:col-span-2">
          <Textarea label="Notes" {...register("notes")} rows={3} />
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        {loading ? "Saving..." : isEdit ? "Save Changes" : "Add First Timer"}
      </Button>
    </form>
  );
}
