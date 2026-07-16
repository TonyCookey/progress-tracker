"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";

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
      <TableRow>
        <TableCell>{item.label}</TableCell>
        <TableCell className="text-neutral-400">{item.key}</TableCell>
        <TableCell>{item.sortOrder}</TableCell>
        <TableCell>{item.active ? "Active" : "Inactive"}</TableCell>
        <TableCell className="text-right space-x-2">
          <button onClick={() => setEditing(true)} className="text-accent-600 hover:underline text-sm">
            Edit
          </button>
          <button onClick={toggleActive} disabled={loading} className="text-warning-700 hover:underline text-sm">
            {item.active ? "Deactivate" : "Activate"}
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-accent-50/40">
      <TableCell>
        <Input {...register("label", { required: true })} />
      </TableCell>
      <TableCell className="text-neutral-400">{item.key}</TableCell>
      <TableCell>
        <Input type="number" {...register("sortOrder", { valueAsNumber: true })} className="w-20" />
      </TableCell>
      <TableCell>{item.active ? "Active" : "Inactive"}</TableCell>
      <TableCell className="text-right space-x-2">
        <button onClick={handleSubmit(save)} disabled={loading} className="text-success-700 hover:underline text-sm">
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-neutral-500 hover:underline text-sm">
          Cancel
        </button>
      </TableCell>
    </TableRow>
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
      <Input {...register("label", { required: true })} label="New Value" placeholder="e.g. Prayer Meeting" />
      <Button type="submit" disabled={loading} isLoading={loading}>
        {loading ? "Adding..." : "Add"}
      </Button>
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
    <Card className="mb-6">
      <h2 className="text-lg font-semibold mb-3 text-neutral-900">{title}</h2>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <TableContainer className="border-0 shadow-none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Label</TableHeaderCell>
                <TableHeaderCell>Key</TableHeaderCell>
                <TableHeaderCell>Order</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <tbody>
              {items.map((item) => (
                <EditRefDataRow key={item.id} item={item} onSuccess={fetchItems} />
              ))}
            </tbody>
          </Table>
        </TableContainer>
      )}
      <AddRefDataForm category={category} onSuccess={fetchItems} />
    </Card>
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
