"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../common/LoadingSpinner";

type Base = { id: string; name: string; label: string | null };

function EditBaseRow({ base, onSuccess }: { base: Base; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { name: base.name, label: base.label || "" } });

  const onSubmit = async (data: { name: string; label: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bases/${base.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update base: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      setEditing(false);
      onSuccess();
    } catch (err) {
      alert("Failed to update base");
      console.error("Failed to update base", err);
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <tr className="border-t">
        <td className="px-4 py-3">{base.name}</td>
        <td className="px-4 py-3">{base.label || "-"}</td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline text-sm">
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t bg-blue-50">
      <td className="px-4 py-2">
        <input {...register("name", { required: true })} className="w-full border px-2 py-1 rounded" />
      </td>
      <td className="px-4 py-2">
        <input {...register("label")} className="w-full border px-2 py-1 rounded" />
      </td>
      <td className="px-4 py-2 text-right space-x-2">
        <button onClick={handleSubmit(onSubmit)} disabled={loading} className="text-green-700 hover:underline text-sm">
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline text-sm">
          Cancel
        </button>
      </td>
    </tr>
  );
}

function AddBaseForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "", label: "" } });

  const onSubmit = async (data: { name: string; label: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to create base: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      onSuccess();
    } catch (err) {
      alert("Failed to create base");
      console.error("Failed to create base", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input {...register("name", { required: true })} className="border px-3 py-2 rounded" placeholder="e.g. Charlie" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Report Label</label>
        <input {...register("label")} className="border px-3 py-2 rounded" placeholder="e.g. Downtown" />
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Adding..." : "Add Base"}
      </button>
    </form>
  );
}

export default function BasesPanel() {
  const [bases, setBases] = useState<Base[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bases");
      const data = await res.json();
      setBases(data);
    } catch (error) {
      console.error("Failed to fetch bases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="shadow rounded p-2 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Report Label</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bases.map((base) => (
              <EditBaseRow key={base.id} base={base} onSuccess={fetchBases} />
            ))}
          </tbody>
        </table>
      </div>
      <AddBaseForm onSuccess={fetchBases} />
    </div>
  );
}
