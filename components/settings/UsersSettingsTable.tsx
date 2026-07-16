"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import EditGeneralModal from "../generals/EditGeneralModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";

interface General {
  id: string;
  name: string;
  email: string;
  role: string;
  deletedAt: string | null;
  base: { name: string };
}

export default function UsersSettingsTable() {
  const [generals, setGenerals] = useState<General[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchGenerals = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/generals?page=${currentPage}&includeArchived=true`);
      const data = await res.json();
      setGenerals(data.generals);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch generals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerals(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const toggleActive = async (general: General) => {
    setActioningId(general.id);
    try {
      const res = await fetch(`/api/generals/${general.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !!general.deletedAt }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to update status: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      fetchGenerals(page);
    } catch (err) {
      alert("Failed to update status");
      console.error("Failed to update status", err);
    } finally {
      setActioningId(null);
    }
  };

  const sendReset = async (general: General) => {
    setActioningId(general.id);
    try {
      const res = await fetch(`/api/generals/${general.id}/send-reset`, { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to send reset email: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      alert(`Password reset email sent to ${general.email}`);
    } catch (err) {
      alert("Failed to send reset email");
      console.error("Failed to send reset email", err);
    } finally {
      setActioningId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Card>
      {/* Desktop Table */}
      <TableContainer className="hidden md:block border-0 shadow-none">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Base</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {generals.map((general) => (
              <TableRow key={general.id}>
                <TableCell className="font-medium text-neutral-900">{general.name}</TableCell>
                <TableCell>{general.email}</TableCell>
                <TableCell>{general.base?.name ?? "-"}</TableCell>
                <TableCell>{general.role}</TableCell>
                <TableCell>
                  {general.deletedAt ? <Badge tone="danger">Inactive</Badge> : <Badge tone="success">Active</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  <EditGeneralModal general={general} onSuccess={() => fetchGenerals(page)} />
                  <button
                    onClick={() => toggleActive(general)}
                    disabled={actioningId === general.id}
                    className="px-3 py-1 rounded-pill text-sm bg-warning-50 text-warning-700 hover:bg-warning-50/70 disabled:opacity-50"
                  >
                    {general.deletedAt ? "Activate" : "Deactivate"}
                  </button>
                  <button
                    onClick={() => sendReset(general)}
                    disabled={actioningId === general.id}
                    className="px-3 py-1 rounded-pill text-sm bg-accent-50 text-accent-700 hover:bg-accent-100 disabled:opacity-50"
                  >
                    Send Password Reset
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {generals.map((general) => (
          <Card key={general.id} padded className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm break-words leading-snug text-neutral-900">{general.name}</span>
              {general.deletedAt ? <Badge tone="danger">Inactive</Badge> : <Badge tone="success">Active</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-700">Email:</span> {general.email}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Base:</span> {general.base?.name ?? "-"}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Role:</span> {general.role}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <EditGeneralModal general={general} onSuccess={() => fetchGenerals(page)} />
              <button
                onClick={() => toggleActive(general)}
                disabled={actioningId === general.id}
                className="min-h-11 md:min-h-0 px-3 py-1 rounded-pill text-sm bg-warning-50 text-warning-700 hover:bg-warning-50/70 disabled:opacity-50"
              >
                {general.deletedAt ? "Activate" : "Deactivate"}
              </button>
              <button
                onClick={() => sendReset(general)}
                disabled={actioningId === general.id}
                className="min-h-11 md:min-h-0 px-3 py-1 rounded-pill text-sm bg-accent-50 text-accent-700 hover:bg-accent-100 disabled:opacity-50"
              >
                Send Password Reset
              </button>
            </div>
          </Card>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </Card>
  );
}
