"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TrashIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/formatDate";
import LoadingSpinner from "../common/LoadingSpinner";
import { CreateFirstTimerModal, EditFirstTimerModal } from "./FirstTimerModals";
import type { FirstTimer } from "./FirstTimerForm";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";


export default function FirstTimersTable() {
  const { data: session } = useSession();
  const toast = useToast();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const [firstTimers, setFirstTimers] = useState<FirstTimer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [baseId, setBaseId] = useState(user?.baseId ?? "");
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);
  const limit = 10;

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
    setBaseId(user?.baseId ?? "");
  }, [isSuperAdmin, user?.baseId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/first-timers?page=${page}&limit=${limit}&search=${search}&baseId=${baseId}`, { cache: "no-store" });
      const { data, total } = await res.json();
      setFirstTimers(data);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [page, search, baseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this first timer record?")) return;
    const res = await fetch(`/api/first-timers/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete first timer");
      return;
    }
    toast.success("New convert deleted successfully");
    fetchData();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          {isSuperAdmin && (
            <Select
              value={baseId}
              onChange={(e) => {
                setBaseId(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto"
            >
              <option value="">All Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />
          <Button variant="secondary" onClick={fetchData} leftIcon={<ArrowPathIcon className="w-5 h-5" />} className="w-full sm:w-auto sm:mx-2">
            Refresh
          </Button>
        </div>
        <CreateFirstTimerModal onSuccess={fetchData} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Gender</TableHeaderCell>
                    <TableHeaderCell>Visit Date</TableHeaderCell>
                    <TableHeaderCell>Base</TableHeaderCell>
                    <TableHeaderCell>Followed Up</TableHeaderCell>
                    <TableHeaderCell>Returned</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {firstTimers.map((nc) => (
                    <TableRow key={nc.id}>
                      <TableCell className="font-medium text-neutral-900">{nc.name}</TableCell>
                      <TableCell>{nc.gender ?? "-"}</TableCell>
                      <TableCell>{formatDate(nc.visitDate)}</TableCell>
                      <TableCell>{nc.base?.name ?? "-"}</TableCell>
                      <TableCell>{nc.followedUp ? <CheckCircleIcon className="w-5 h-5 text-success-700" /> : "-"}</TableCell>
                      <TableCell>{nc.returned ? <CheckCircleIcon className="w-5 h-5 text-success-700" /> : "-"}</TableCell>
                      <TableCell className="flex space-x-2">
                        <EditFirstTimerModal firstTimer={nc} onSuccess={fetchData} />
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded-pill hover:bg-danger-50 transition">
                            <TrashIcon className="w-5 h-5 text-danger-500" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {firstTimers.map((nc) => (
              <Card key={nc.id} padded className="p-4 flex flex-col gap-2">
                <span className="font-medium text-sm text-neutral-900">{nc.name}</span>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Gender:</span> {nc.gender ?? "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Visit Date:</span> {formatDate(nc.visitDate)}
                  </div>
                  <div>
                    <span className="font-semibold">Base:</span> {nc.base?.name ?? "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Followed Up:</span> {nc.followedUp ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-semibold">Returned:</span> {nc.returned ? "Yes" : "No"}
                  </div>
                </div>
                <div className="flex mt-2 justify-end space-x-2">
                  <EditFirstTimerModal firstTimer={nc} onSuccess={fetchData} />
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded-pill hover:bg-danger-50 transition">
                      <TrashIcon className="w-5 h-5 text-danger-500" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
