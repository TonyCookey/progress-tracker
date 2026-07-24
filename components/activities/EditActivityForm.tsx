"use client";

import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import UiSelect, { selectStyles } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Option = { id: string; name: string };
type SquadOption = { value: string; label: string };
type RefDataOption = { id: string; key: string; label: string };
type Group = { id: string; type: "PLATOON" | "SQUAD" };
type Activity = {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  type: string;
  baseId?: string | null;
  isCrossBase?: boolean;
  groups?: Group[];
};

export default function EditActivityForm({ activity }: { activity: Activity }) {
  const platoonId = activity.groups?.find((g) => g.type === "PLATOON")?.id ?? "";
  const squadIds = activity.groups?.filter((g) => g.type === "SQUAD").map((g) => g.id) ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      name: activity.name,
      description: activity.description ?? "",
      date: activity.date ? new Date(activity.date).toISOString().slice(0, 10) : "",
      type: activity.type,
      baseId: activity.isCrossBase ? "cross-base" : (activity.baseId ?? ""),
      platoonId,
      squadIds,
    },
  });
  const router = useRouter();
  const toast = useToast();

  const [bases, setBases] = useState<Option[]>([]);
  const [platoons, setPlatoons] = useState<Option[]>([]);
  const [squads, setSquads] = useState<Option[]>([]);
  const [activityTypes, setActivityTypes] = useState<RefDataOption[]>([]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      setBases(await res.json());
    };
    const fetchSquads = async () => {
      const res = await fetch("/api/groups?type=SQUAD");
      setSquads(await res.json());
    };
    const fetchPlatoons = async () => {
      const res = await fetch("/api/groups?type=PLATOON");
      setPlatoons(await res.json());
    };
    const fetchActivityTypes = async () => {
      const res = await fetch("/api/refdata?category=activity_type&includeInactive=true");
      if (!res.ok) return;
      setActivityTypes(await res.json());
    };

    fetchBases();
    fetchSquads();
    fetchPlatoons();
    fetchActivityTypes();
  }, []);

  useSyncSelectValue(bases, setValue, "baseId", activity.isCrossBase ? "cross-base" : (activity.baseId ?? ""));
  useSyncSelectValue(platoons, setValue, "platoonId", platoonId);
  useSyncSelectValue(activityTypes, setValue, "type", activity.type);

  const onSubmit = async (data: any) => {
    try {
      if (data.baseId === "cross-base") {
        data.baseId = null;
        data.isCrossBase = true;
      }
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, squadIds: data.squadIds?.map((s: string | Option) => (typeof s === "string" ? s : s.id)) }),
      });
      if (!res.ok) {
        console.error("Failed to update activity", res.statusText);
        toast.error("Failed to update activity");
        return;
      }
      toast.success("Activity updated successfully");
      setTimeout(() => router.push(`/dashboard/activities/${activity.id}`), 800);
    } catch (error) {
      console.error("Failed to update activity:", error);
      toast.error("Failed to update activity");
    }
  };
  const squadOptions: SquadOption[] = squads.map((s) => ({ value: s.id, label: s.name }));

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h1 className="text-lg font-semibold">Edit Activity</h1>
        <Input id="name" label="Title" {...register("name", { required: true })} error={errors.name && "Title is required."} />

        <Textarea id="description" label="Description" {...register("description")} rows={3} />

        <Input id="date" type="date" label="Date" {...register("date", { required: true })} error={errors.date && "Date is required."} />

        <UiSelect id="type" label="Type" {...register("type", { required: true })} error={errors.type && "Please select a type."}>
          <option value="" disabled>
            Select a type
          </option>
          {activityTypes.map((t) => (
            <option key={t.id} value={t.key}>
              {t.label}
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

        <UiSelect id="platoonId" label="Platoon (optional)" {...register("platoonId")}>
          <option value="">None</option>
          {platoons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </UiSelect>

        <div>
          <label htmlFor="squadIds" className="block text-sm font-medium mb-1">
            Squads
          </label>
          <Controller
            name="squadIds"
            control={control}
            render={({ field }) => (
              <Select<SquadOption, true>
                {...field}
                isMulti
                options={squadOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={selectStyles}
                value={squadOptions.filter((opt) => (field.value as string[])?.includes(opt.value))}
                onChange={(selected) => field.onChange(selected.map((opt) => opt.value))}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Activity"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
