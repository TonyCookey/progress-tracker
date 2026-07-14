"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

type FormData = {
  name: string;
  description: string;
  baseId: string;
  leaderId: string;
  supportIds: string[];
};

type Option = { id: string; name: string };
type SupportOption = { value: string; label: string };

type Group = FormData & { id: string; type: "PLATOON" | "SQUAD" };

export default function EditGroupForm({ group, onSuccess }: { group: Group; onSuccess: () => void }) {
  const { register, handleSubmit, reset, control, setValue } = useForm<FormData>({
    defaultValues: {
      name: group.name || "",
      description: group.description || "",
      baseId: group.baseId || "",
      leaderId: group.leaderId || "",
      supportIds: group.supportIds || [],
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);
  const [generals, setGenerals] = useState<Option[]>([]);

  useEffect(() => {
    setValue("name", group.name || "");
    setValue("description", group.description || "");
    setValue("baseId", group.baseId || "");
    setValue("leaderId", group.leaderId || "");
    setValue("supportIds", group.supportIds || []);
  }, [group, setValue]);

  useEffect(() => {
    fetch("/api/bases")
      .then((res) => res.json())
      .then(setBases);
    fetch("/api/generals?limit=1000")
      .then((res) => res.json())
      .then((data) => setGenerals(data.generals ?? []));
  }, []);

  useSyncSelectValue(bases, setValue, "baseId", group.baseId || "");
  useSyncSelectValue(generals, setValue, "leaderId", group.leaderId || "");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type: group.type }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update group: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      onSuccess();
    } catch (err) {
      alert("Failed to update group");
      console.error("Failed to update group", err);
    } finally {
      setLoading(false);
    }
  };

  const supportOptions: SupportOption[] = generals.map((g) => ({ value: g.id, label: g.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input {...register("name", { required: true })} className="w-full border px-3 py-2 rounded" />
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

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea {...register("description")} className="w-full border px-3 py-2 rounded" rows={3} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Leader (General)</label>
          <select {...register("leaderId", { required: true })} className="w-full border px-3 py-2 rounded">
            <option value="">Select a leader</option>
            {generals.map((general) => (
              <option key={general.id} value={general.id}>
                {general.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Supporting Generals</label>
          <Controller
            name="supportIds"
            control={control}
            render={({ field }) => (
              <Select<SupportOption, true>
                {...field}
                isMulti
                options={supportOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                value={supportOptions.filter((opt) => field.value?.includes(opt.value))}
                onChange={(selected) => field.onChange(selected.map((opt) => opt.value))}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Updating..." : "Update Group"}
      </button>
    </form>
  );
}
