"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";
import CreateImageField from "../input/CreateImageField";
import { compressImage } from "@/lib/compressImage";
import Input from "@/components/ui/Input";
import UISelect, { selectStyles } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  groupId: string;
  squadIds: string[];
  householdId: string;
  phone: string;
  address: string;
  school: string;
  guardianName: string;
  guardianPhone: string;
  dateJoined: string;
  status: string;
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
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Option[]>([]);
  const [squads, setSquads] = useState<Option[]>([]);
  const [platoons, setPlatoons] = useState<Option[]>([]);
  const [households, setHouseholds] = useState<Option[]>([]);
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
    const fetchHouseholds = async () => {
      const res = await fetch("/api/households");
      const data = await res.json();
      setHouseholds(data);
    };

    fetchBases();
    fetchSquads();
    fetchPlatoons();
    fetchHouseholds();
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
        await uploadTeenImage(compressed, lieutenantId);
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
        body: JSON.stringify({ ...data, rank: "LIEUTENANT", householdId: data.householdId || null }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to create lieutenant", res.status, res.statusText, text);
        toast.error(`Failed to create lieutenant: ${res.status} ${res.statusText} - ${text}`);
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
      toast.success("Lieutenant created successfully");
      onSuccess();
    } catch (err) {
      console.error("Failed to create lieutenant", err);
      console.log("Error details:", err instanceof Error ? err.message : err);
      toast.error("Failed to create lieutenant");
    } finally {
      setLoading(false);
    }
  };
  const squadOptions: SquadOption[] = squads.map((s) => ({ value: s.id, label: s.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Full Name" {...register("name", { required: true })} />

        <UISelect label="Gender" {...register("gender")}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </UISelect>

        <Input label="Date of Birth" type="date" {...register("dateOfBirth", { required: true })} />

        <UISelect label="Base" {...register("baseId", { required: true })}>
          <option value="">Select a base</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.name}
            </option>
          ))}
        </UISelect>

        <UISelect label="Platoon" {...register("groupId", { required: true })}>
          <option value="">Select a Platoon</option>
          {platoons.map((platoon) => (
            <option key={platoon.id} value={platoon.id}>
              {platoon.name}
            </option>
          ))}
        </UISelect>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Squads</label>
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
                value={squadOptions.filter((opt) => field.value?.includes(opt.value))}
                onChange={(selected) => field.onChange(selected.map((opt) => opt.value))}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

        <UISelect label="Household" {...register("householdId")}>
          <option value="">No household</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.name}
            </option>
          ))}
        </UISelect>

        <Input label="Phone" {...register("phone")} />

        <Input label="Address" {...register("address")} />

        <Input label="School" {...register("school")} />

        <Input label="Date Joined" type="date" {...register("dateJoined")} />

        <Input label="Guardian Name" {...register("guardianName")} />

        <Input label="Guardian Phone" {...register("guardianPhone")} />

        <UISelect label="Status" {...register("status")} defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="LEFT">Left</option>
        </UISelect>

        <div className="md:col-span-2">
          <div className="mt-6">
            <CreateImageField onFileChange={setImageFile} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        {loading ? "Creating..." : "Create Lieutenant"}
      </Button>
    </form>
  );
}
