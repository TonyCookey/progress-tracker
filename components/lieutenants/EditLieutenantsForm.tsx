"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";
import CreateImageField from "../input/CreateImageField";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  groupId: string;
  squadIds: string[];
  imageUrl?: string;
};

type Base = {
  id: string;
  name: string;
};
type SquadOption = {
  value: string;
  label: string;
};

export default function EditLieutenantForm({ lieutenant, onSuccess }: { lieutenant: FormData & { id: string; imageUrl?: string }; onSuccess: () => void }) {
  const { register, handleSubmit, reset, control, setValue } = useForm<FormData>({
    defaultValues: {
      name: lieutenant.name || "",
      gender: lieutenant.gender || "Male",
      dateOfBirth: lieutenant.dateOfBirth || "",
      baseId: lieutenant.baseId || "",
      groupId: lieutenant.groupId || "",
      squadIds: lieutenant.squadIds || [],
      imageUrl: lieutenant.imageUrl || "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);
  const [squads, setSquads] = useState<Base[]>([]);
  const [platoons, setPlatoons] = useState<Base[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(lieutenant.imageUrl || "");

  useEffect(() => {
    setValue("name", lieutenant.name || "");
    setValue("gender", lieutenant.gender || "Male");
    setValue("dateOfBirth", lieutenant.dateOfBirth || "");
    setValue("baseId", lieutenant.baseId || "");
    setValue("groupId", lieutenant.groupId || "");
    setValue("squadIds", lieutenant.squadIds || []);
    setPreviewUrl(lieutenant.imageUrl || "");
  }, [lieutenant]);

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

  const uploadLieutenantImage = async (imageFile: File, lieutenantId: string) => {
    try {
      // 1. get signed upload URL
      const res = await fetch("/api/lieutenants/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lieutenantId, fileType: imageFile.type }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to get upload URL: ${res.status} ${res.statusText} - ${text}`);
      }

      const { url, key } = await res.json();

      // 2. upload directly to R2
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: imageFile,
        headers: { "Content-Type": imageFile.type },
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Failed to upload image to storage: ${uploadRes.status} ${uploadRes.statusText} - ${text}`);
      }

      // 3. save key in DB
      const saveRes = await fetch("/api/lieutenants/save-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lieutenantId, key }),
      });

      if (!saveRes.ok) {
        const text = await saveRes.text();
        throw new Error(`Failed to save image key: ${saveRes.status} ${saveRes.statusText} - ${text}`);
      }
    } catch (err) {
      console.error("uploadLieutenantImage error:", err);
      throw err;
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lieutenants/${lieutenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rank: "LIEUTENANT" }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update lieutenant: ${res.status} ${res.statusText} - ${text}`);
        return;
      }

      if (imageFile) {
        await uploadLieutenantImage(imageFile, lieutenant.id);
      }
      reset();
      onSuccess();
    } catch (err) {
      alert("Failed to update lieutenant");
      console.error("Failed to update lieutenant", err);
    } finally {
      setLoading(false);
    }
  };

  const squadOptions: SquadOption[] = squads.map((s) => ({ value: s.id, label: s.name }));

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
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Birth</label>
          <input type="date" {...register("dateOfBirth", { required: true })} className="w-full border px-3 py-2 rounded" />
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
          <label className="block text-sm font-medium mb-2">Platoon</label>
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
          <label className="block text-sm font-medium mb-2">Squads</label>
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

        <div className="md:col-span-2">
          <div className="mt-6 flex flex-col items-center gap-2">
            {previewUrl && <img src={previewUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-2" />}
            <CreateImageField
              onFileChange={(file) => {
                setImageFile(file);
                if (file) setPreviewUrl(URL.createObjectURL(file));
                else setPreviewUrl(lieutenant.imageUrl || "");
              }}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Updating..." : "Update Lieutenant"}
      </button>
    </form>
  );
}
