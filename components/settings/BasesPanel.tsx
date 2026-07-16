"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";

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
      <TableRow>
        <TableCell>{base.name}</TableCell>
        <TableCell>{base.label || "-"}</TableCell>
        <TableCell className="text-right">
          <button onClick={() => setEditing(true)} className="text-accent-600 hover:underline text-sm">
            Edit
          </button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-accent-50/40">
      <TableCell>
        <Input {...register("name", { required: true })} />
      </TableCell>
      <TableCell>
        <Input {...register("label")} />
      </TableCell>
      <TableCell className="text-right space-x-2">
        <button onClick={handleSubmit(onSubmit)} disabled={loading} className="text-success-700 hover:underline text-sm">
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={() => setEditing(false)} className="text-neutral-500 hover:underline text-sm">
          Cancel
        </button>
      </TableCell>
    </TableRow>
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
      <Input {...register("name", { required: true })} label="Name" placeholder="e.g. Charlie" />
      <Input {...register("label")} label="Report Label" placeholder="e.g. Downtown" />
      <Button type="submit" disabled={loading} isLoading={loading}>
        {loading ? "Adding..." : "Add Base"}
      </Button>
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
    <Card>
      <TableContainer className="border-0 shadow-none">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Report Label</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {bases.map((base) => (
              <EditBaseRow key={base.id} base={base} onSuccess={fetchBases} />
            ))}
          </tbody>
        </Table>
      </TableContainer>
      <AddBaseForm onSuccess={fetchBases} />
    </Card>
  );
}
