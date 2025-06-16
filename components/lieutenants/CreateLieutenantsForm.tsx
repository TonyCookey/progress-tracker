"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  groupId: string;
  squadIds: string[];
};
type Option = {
  id: string;
  name: string;
};
type SquadOption = {
  value: string;
  label: string;
};

export default function CreateLieutenantForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, reset, control } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);
  const [squads, setSquads] = useState<Option[]>([]);
  const [platoons, setPlatoons] = useState<Option[]>([]);

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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lieutenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rank: "LIEUTENANT" }),
      });
      if (!res.ok) {
        console.error("Failed to create lieutenant", res.statusText);
        alert("Failed to create lieutenant");
      }
      reset();
      onSuccess();
    } catch (err) {
      console.error("Failed to create lieutenant", err);
    } finally {
      setLoading(false);
    }
  };
  const squadOptions: SquadOption[] = squads.map((s) => ({ value: s.id, label: s.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input {...register("name", { required: true })} className="w-full border px-3 py-2 rounded" />
      </div>

      <div>
        <label className="block text-sm font-medium">Gender</label>
        <select {...register("gender")} className="w-full border px-3 py-2 rounded">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Date of Birth</label>
        <input type="date" {...register("dateOfBirth", { required: true })} className="w-full border px-3 py-2 rounded" />
      </div>

      <div>
        <label className="block text-sm mb-1">Base</label>
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
        <label className="block text-sm mb-1">Platoon</label>
        <select {...register("groupId", { required: true })} className="w-full border px-3 py-2 rounded">
          <option value="">Select a Platoon</option>
          {platoons.map((platoon) => (
            <option key={platoon.id} value={platoon.id}>
              {platoon.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Squads</label>
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

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full" disabled={loading}>
        {loading ? "Creating..." : "Create Lieutenant"}
      </button>
    </form>
  );
}
