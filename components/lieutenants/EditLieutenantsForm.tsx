"use client";

import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import Select from "react-select";
import CreateImageField from "../input/CreateImageField";
import { useSyncSelectValue } from "@/lib/hooks/useSyncSelectValue";

type FormData = {
  name: string;
  gender: string;
  dateOfBirth: string;
  baseId: string;
  platoonId: string;
  squadIds: string[];
  householdId: string;
  imageUrl?: string;
  phone: string;
  address: string;
  school: string;
  guardianName: string;
  guardianPhone: string;
  dateJoined: string;
  status: string;
};

type Base = {
  id: string;
  name: string;
};
type SquadOption = {
  value: string;
  label: string;
};

// The incoming teen record still uses the Prisma field name `groupId` for its
// platoon assignment; the form field is `platoonId` to match updateTeenSchema.
type Lieutenant = Omit<FormData, "platoonId"> & { id: string; imageUrl?: string; groupId?: string };

export default function EditLieutenantForm({ lieutenant, onSuccess }: { lieutenant: Lieutenant; onSuccess: () => void }) {
  const { register, handleSubmit, reset, control, setValue } = useForm<FormData>({
    defaultValues: {
      name: lieutenant.name || "",
      gender: lieutenant.gender || "Male",
      dateOfBirth: lieutenant.dateOfBirth ? new Date(lieutenant.dateOfBirth).toISOString().slice(0, 10) : "",
      baseId: lieutenant.baseId || "",
      platoonId: lieutenant.groupId || "",
      squadIds: lieutenant.squadIds || [],
      householdId: lieutenant.householdId || "",
      imageUrl: lieutenant.imageUrl || "",
      phone: lieutenant.phone || "",
      address: lieutenant.address || "",
      school: lieutenant.school || "",
      guardianName: lieutenant.guardianName || "",
      guardianPhone: lieutenant.guardianPhone || "",
      dateJoined: lieutenant.dateJoined ? new Date(lieutenant.dateJoined).toISOString().slice(0, 10) : "",
      status: lieutenant.status || "ACTIVE",
    },
  });
  const [loading, setLoading] = useState(false);
  const [bases, setBases] = useState<Base[]>([]);
  const [squads, setSquads] = useState<Base[]>([]);
  const [platoons, setPlatoons] = useState<Base[]>([]);
  const [households, setHouseholds] = useState<Base[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(lieutenant.imageUrl || "");

  useEffect(() => {
    setValue("name", lieutenant.name || "");
    setValue("gender", lieutenant.gender || "Male");
    setValue("dateOfBirth", lieutenant.dateOfBirth ? new Date(lieutenant.dateOfBirth).toISOString().slice(0, 10) : "");
    setValue("baseId", lieutenant.baseId || "");
    setValue("platoonId", lieutenant.groupId || "");
    setValue("squadIds", lieutenant.squadIds || []);
    setValue("householdId", lieutenant.householdId || "");
    setValue("phone", lieutenant.phone || "");
    setValue("address", lieutenant.address || "");
    setValue("school", lieutenant.school || "");
    setValue("guardianName", lieutenant.guardianName || "");
    setValue("guardianPhone", lieutenant.guardianPhone || "");
    setValue("dateJoined", lieutenant.dateJoined ? new Date(lieutenant.dateJoined).toISOString().slice(0, 10) : "");
    setValue("status", lieutenant.status || "ACTIVE");
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

  useSyncSelectValue(bases, setValue, "baseId", lieutenant.baseId || "");
  useSyncSelectValue(platoons, setValue, "platoonId", lieutenant.groupId || "");
  useSyncSelectValue(households, setValue, "householdId", lieutenant.householdId || "");

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
        body: JSON.stringify({ ...data, rank: "LIEUTENANT", householdId: data.householdId || null }),
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
          <select {...register("platoonId", { required: true })} className="w-full border px-3 py-2 rounded">
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

        <div>
          <label className="block text-sm font-medium mb-2">Household</label>
          <select {...register("householdId")} className="w-full border px-3 py-2 rounded">
            <option value="">No household</option>
            {households.map((household) => (
              <option key={household.id} value={household.id}>
                {household.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input {...register("phone")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input {...register("address")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">School</label>
          <input {...register("school")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date Joined</label>
          <input type="date" {...register("dateJoined")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Guardian Name</label>
          <input {...register("guardianName")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Guardian Phone</label>
          <input {...register("guardianPhone")} className="w-full border px-3 py-2 rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select {...register("status")} className="w-full border px-3 py-2 rounded">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LEFT">Left</option>
          </select>
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
