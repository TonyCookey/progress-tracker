"use client";

import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Option = { id: string; name: string };
type SquadOption = {
  value: string;
  label: string;
};
export default function CreateActivityForm() {
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
      console.log(data, "Fetched bases data");
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
      if (data.baseId === "cross-base") {
        data.baseId = null;
        data.isCrossBase = true;
      }
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, squadIds: data.squadIds?.map((s: Option) => s.id) }),
      });
      if (!res.ok) {
        console.error("Failed to create lieutenant", res.statusText);
        alert("Failed to create lieutenant");
      }
      reset();
      router.push("/dashboard/activities");
    } catch (error) {
      console.error("Failed to create activity:", error);
    }
  };
  const squadOptions: SquadOption[] = squads.map((s) => ({ value: s.id, label: s.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-10 bg-white rounded shadow-md">
      <h1 className="text-xl font-semibold">Create Activity</h1>
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input id="title" {...register("name", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea id="description" {...register("description")} className="w-full border rounded px-3 py-2 mt-1" rows={3} />
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium">
          Date
        </label>
        <input type="date" id="date" {...register("date", { required: true })} className="w-full border rounded px-3 py-2 mt-1" />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium">
          Type
        </label>
        <select id="type" {...register("type")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="Outreach">Outreach</option>
          <option value="Worship">Worship</option>
          <option value="Bible Study">Bible Study</option>
          <option value="Recreation">Hangouts</option>
        </select>
      </div>

      <div>
        <label htmlFor="baseId" className="block text-sm font-medium">
          Base
        </label>
        <select id="baseId" {...register("baseId")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="">Select a Base</option>
          <option value="cross-base">Cross Base</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="platoonId" className="block text-sm font-medium">
          Platoon (optional)
        </label>
        <select id="platoonId" {...register("platoonId")} className="w-full border rounded px-3 py-2 mt-1">
          <option value="">None</option>
          {platoons.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="squadIds" className="block font-medium mb-1">
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
              value={squadOptions.filter((opt) => field.value?.includes(opt.value))}
              onChange={(selected) => field.onChange(selected.map((opt) => opt.value))}
              onBlur={field.onBlur}
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
