"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";
import CreateImageField from "../input/CreateImageField";
import { compressImage } from "@/lib/compressImage";

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
  const [imageFile, setImageFile] = useState<File | null>(null);

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

  const uploadTeenImage = async (imageFile: File, lieutenantId: string) => {
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
      console.log("Got upload URL");

      if (imageFile) {
        const compressed = await compressImage(imageFile);
        await uploadTeenImage(compressed, teen.id);
      }

      // 2. upload directly to R2 (this can fail due to CORS or invalid signature)
      const uploadRes = await fetch(url, {
        method: "PUT",
        body: imageFile,
        headers: { "Content-Type": imageFile.type },
      });

      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Failed to upload image to storage: ${uploadRes.status} ${uploadRes.statusText} - ${text}`);
      }
      console.log("Image uploaded to R2");

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
      console.log("Image key saved in DB");
    } catch (err) {
      console.error("uploadTeenImage error:", err);
      // rethrow so caller can show an alert or handle it
      throw err;
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lieutenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rank: "LIEUTENANT" }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to create lieutenant", res.status, res.statusText, text);
        alert(`Failed to create lieutenant: ${res.status} ${res.statusText} - ${text}`);
        return;
      }

      const lieutenant = await res.json();
      console.log("Uploading image for lieutenant");

      // Only attempt to upload if we have an image and a lieutenant ID
      if (imageFile && lieutenant.id) {
        // Compress the image before uploading - 800KB Max
        const compressed = await compressImage(imageFile);
        await uploadTeenImage(compressed, lieutenant.id);
      }
      reset();
      onSuccess();
    } catch (err) {
      console.error("Failed to create lieutenant", err);
      console.log("Error details:", err instanceof Error ? err.message : err);
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
          <div className="mt-6">
            <CreateImageField onFileChange={setImageFile} />
          </div>
        </div>
      </div>

      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full mt-4" disabled={loading}>
        {loading ? "Creating..." : "Create Lieutenant"}
      </button>
    </form>
  );
}
