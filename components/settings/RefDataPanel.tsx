"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../common/LoadingSpinner";

type RefDataItem = { id: string; key: string; label: string; sortOrder: number; active: boolean };

function EditRefDataRow({ item, onSuccess }: { item: RefDataItem; onSuccess: () => void }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { label: item.label, sortOrder: item.sortOrder } });

  const save = async (data: { label: string; sortOrder: number }) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/refdata/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      setEditing(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/refdata/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <tr className="border-t">
        <td className="px-4 py-2">{item.label}</td>
        <td className="px-4 py-2 text-gray-400">{item.key}</td>
        <td className="px-4 py-2">{item.sortOrder}</td>
        <td className="px-4 py-2">{item.active ? "Active" : "Inactive"}</td>
        <td className="px-4 py-2 text-right space-x-2">
          <button onClick={() => setEditing(true)} className="text-blue-600 hover:underline text-sm">
            Edit
          </button>
          <button onClick={toggleActive} disabled={loading} className="text-amber-700 hover:underline text-sm">
            {item.active ? "Deactivate" : "Activate"}
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t bg-blue-50">
      <td className="px-4 py-2">
        <input {...register("label", { required: true })} className="w-full border px-2 py-1 rounded" />
      </td>
      <td className="px-4 py-2 text-gray-400">{item.key}</td>
      <td className="px-4 py-2">
        <input type="number" {...register("sortOrder", { valueAsNumber: true })} className="w-20 border px-2 py-1 rounded" />
      </td>
      <td className="px-4 py-2">{item.active ? "Active" : "Inactive"}</td>
      <td className="px-4 py-2 text-right space-x-2">
        <button onClick={handleSubmit(save)} disabled={loading} className="text-green-700 hover:underline text-sm">
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline text-sm">
          Cancel
        </button>
      </td>
    </tr>
  );
}

function AddRefDataForm({ category, onSuccess }: { category: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { label: "" } });

  const onSubmit = async (data: { label: string }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/refdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label: data.label }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to add: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      reset();
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3 flex items-end gap-3">
      <div>
        <label className="block text-sm font-medium mb-1">New Value</label>
        <input {...register("label", { required: true })} className="border px-3 py-2 rounded" placeholder="e.g. Prayer Meeting" />
      </div>
      <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

function RefDataCategoryTable({ category, title }: { category: string; title: string }) {
  const [items, setItems] = useState<RefDataItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/refdata?category=${category}&includeInactive=true`);
      const data = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="shadow rounded p-2 sm:p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Key</th>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <EditRefDataRow key={item.id} item={item} onSuccess={fetchItems} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddRefDataForm category={category} onSuccess={fetchItems} />
    </div>
  );
}

export default function RefDataPanel() {
  return (
    <div>
      <RefDataCategoryTable category="activity_type" title="Activity Types" />
      <RefDataCategoryTable category="offering_type" title="Offering Types" />
    </div>
  );
}
