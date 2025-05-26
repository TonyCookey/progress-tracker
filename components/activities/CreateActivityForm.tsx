"use client";

import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { value: string; label: string };

type Props = {
  onSuccess: () => void;
};

export default function CreateActivityForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm();
  const router = useRouter();

  const [bases, setBases] = useState<Option[]>([]);
  const [platoons, setPlatoons] = useState<Option[]>([]);
  const [squads, setSquads] = useState<Option[]>([]);

  useEffect(() => {
    const fetchBases = async () => {
      const res = await fetch("/api/bases");
      const data = await res.json();
      setBases(data);
    };
    const fetchSquads = async () => {
      const res = await fetch("/api/groups?type=SQUAD");
      const data = await res.json();
      setSquads(data);
    };
    const fetchPlatoons = async () => {
      const res = await fetch("/api/groups?type=PLATOON");
      const data = await res.json();
      setPlatoons(data);
    };

    fetchBases();
    fetchSquads();
    fetchPlatoons();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, squadIds: data.squadIds?.map((s: Option) => s.value) }),
      });
      if (!res.ok) {
        console.error("Failed to create lieutenant", res.statusText);
        alert("Failed to create lieutenant");
      }
      reset();
      router.refresh();
      onSuccess();
    } catch (error) {
      console.error("Failed to create activity:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input {...register("title", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea {...register("description")} className="w-full border rounded px-3 py-2 mt-1" rows={3} />
      </div>

      <div>
        <label className="block text-sm font-medium">Date</label>
        <input type="date" {...register("date", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label className="block text-sm font-medium">Type</label>
        <select {...register("type")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="Outreach">Outreach</option>
          <option value="Worship">Worship</option>
          <option value="Bible Study">Bible Study</option>
          <option value="Recreation">Recreation</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Base</label>
        <select {...register("baseId")} className="w-full border rounded px-3 py-2 mt-1">
          {bases.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Platoon (optional)</label>
        <select {...register("platoonId")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="">None</option>
          {platoons.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Squads (optional)</label>
        <Controller
          name="squadIds"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              isMulti
              options={squads}
              className="react-select-container"
              classNamePrefix="react-select"
              onChange={(selected) => field.onChange(selected)}
            />
          )}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {isSubmitting ? "Creating..." : "Create Activity"}
        </button>
      </div>
    </form>
  );
}
