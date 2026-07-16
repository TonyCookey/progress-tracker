"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  rank: string;
  groupId: string;
};

type Option = { id: string; name: string };

type NewConvertDetail = {
  id: string;
  name: string;
  gender: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  baseId: string | null;
  date: string;
  activityId: string | null;
  invitedBy: string | null;
  followedUp: boolean;
  notes: string | null;
};

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

export default function ConvertToTeenForm({ newConvert, onSuccess }: { newConvert: NewConvertDetail; onSuccess: () => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: newConvert.name,
      gender: newConvert.gender ?? "",
      dateOfBirth: toDateInput(newConvert.dateOfBirth),
      baseId: newConvert.baseId ?? session?.user?.baseId ?? "",
      rank: "LIEUTENANT",
      groupId: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);
  const [platoons, setPlatoons] = useState<Option[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
    fetch("/api/groups?type=PLATOON")
      .then((res) => res.json())
      .then(setPlatoons);
  }, [isSuperAdmin]);

  useSyncSelectValue(bases, setValue, "baseId", newConvert.baseId ?? session?.user?.baseId ?? "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const baseId = isSuperAdmin ? data.baseId : (session?.user?.baseId ?? data.baseId);

      const teenRes = await fetch("/api/lieutenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          baseId,
          rank: data.rank,
          groupId: data.groupId || undefined,
        }),
      });
      if (!teenRes.ok) {
        const text = await teenRes.text();
        alert(`Failed to create teen: ${teenRes.status} ${teenRes.statusText} - ${text}`);
        return;
      }
      const teen = await teenRes.json();

      const linkRes = await fetch(`/api/new-converts/${newConvert.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newConvert.name,
          gender: newConvert.gender,
          phone: newConvert.phone,
          dateOfBirth: newConvert.dateOfBirth,
          baseId: newConvert.baseId,
          date: newConvert.date,
          activityId: newConvert.activityId,
          invitedBy: newConvert.invitedBy,
          followedUp: newConvert.followedUp,
          notes: newConvert.notes,
          becameTeen: true,
          teenId: teen.id,
        }),
      });
      if (!linkRes.ok) {
        const text = await linkRes.text();
        alert(
          `Teen was created, but linking it back to the New Convert record failed: ${linkRes.status} ${linkRes.statusText} - ${text}. ` +
            `You can link it manually by editing the New Convert entry.`,
        );
        return;
      }

      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <p className="text-sm text-neutral-500 mb-4">
        Creates a new Teen record from this New Convert&apos;s details, and marks the New Convert as having become a teen.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Full Name" {...register("name", { required: true })} error={errors.name && "This field is required"} />

        <Select label="Gender" {...register("gender", { required: true })} error={errors.gender && "This field is required"}>
          <option value="">Select</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </Select>

        <Input
          label="Date of Birth"
          type="date"
          {...register("dateOfBirth", { required: true })}
          error={errors.dateOfBirth && "This field is required"}
        />

        <Select label="Rank" {...register("rank", { required: true })} error={errors.rank && "This field is required"}>
          <option value="LIEUTENANT">Lieutenant</option>
          <option value="CAPTAIN">Captain</option>
        </Select>

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

        <Select label="Platoon" {...register("groupId")}>
          <option value="">No platoon yet</option>
          {platoons.map((platoon) => (
            <option key={platoon.id} value={platoon.id}>
              {platoon.name}
            </option>
          ))}
        </Select>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        {loading ? "Converting..." : "Create Teen & Link"}
      </Button>
    </form>
  );
}
