"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { TrashIcon, ArrowPathIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import LoadingSpinner from "../common/LoadingSpinner";
import CreateNewConvertModal from "./CreateNewConvertModal";
import EditNewConvertModal from "./EditNewConvertModal";
import ConvertToTeenModal from "./ConvertToTeenModal";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type NewConvert = {
  id: string;
  name: string;
  gender: string | null;
  date: string;
  baseId: string | null;
  base: { id: string; name: string } | null;
  followedUp: boolean;
  becameTeen: boolean;
  teenId: string | null;
  invitedBy: string | null;
  notes: string | null;
};

export default function NewConvertsTable() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const [newConverts, setNewConverts] = useState<NewConvert[]>([]);
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
      const res = await fetch(`/api/new-converts?page=${page}&limit=${limit}&search=${search}&baseId=${baseId}`, { cache: "no-store" });
      const { data, total } = await res.json();
      setNewConverts(data);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [page, search, baseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this new convert record?")) return;
    const res = await fetch(`/api/new-converts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete new convert");
      return;
    }
    fetchData();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const conversionAction = (nc: NewConvert) =>
    nc.teenId ? (
      <Link href={`/dashboard/lieutenants/${nc.teenId}`} title="View Teen" className="p-2 rounded hover:bg-accent-50 transition">
        <ArrowRightIcon className="w-5 h-5 text-accent-600" />
      </Link>
    ) : (
      <ConvertToTeenModal newConvertId={nc.id} onSuccess={fetchData} />
    );

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
        <CreateNewConvertModal onSuccess={fetchData} />
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
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Base</TableHeaderCell>
                    <TableHeaderCell>Followed Up</TableHeaderCell>
                    <TableHeaderCell>Became Teen</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {newConverts.map((nc) => (
                    <TableRow key={nc.id}>
                      <TableCell className="font-medium text-neutral-900">{nc.name}</TableCell>
                      <TableCell>{nc.gender ?? "-"}</TableCell>
                      <TableCell>{formatDate(nc.date)}</TableCell>
                      <TableCell>{nc.base?.name ?? "Cross Base"}</TableCell>
                      <TableCell>{nc.followedUp ? <CheckCircleIcon className="w-5 h-5 text-success-700" /> : "-"}</TableCell>
                      <TableCell>{nc.becameTeen ? <CheckCircleIcon className="w-5 h-5 text-success-700" /> : "-"}</TableCell>
                      <TableCell className="flex space-x-2">
                        <EditNewConvertModal newConvert={nc} onSuccess={fetchData} />
                        {conversionAction(nc)}
                        {isSuperAdmin && (
                          <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded hover:bg-danger-50 transition">
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
            {newConverts.map((nc) => (
              <div key={nc.id} className="border border-neutral-200 rounded-card shadow-soft bg-white p-4 flex flex-col gap-2">
                <span className="font-medium text-base">{nc.name}</span>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Gender:</span> {nc.gender ?? "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Date:</span> {formatDate(nc.date)}
                  </div>
                  <div>
                    <span className="font-semibold">Base:</span> {nc.base?.name ?? "Cross Base"}
                  </div>
                  <div>
                    <span className="font-semibold">Followed Up:</span> {nc.followedUp ? "Yes" : "No"}
                  </div>
                  <div>
                    <span className="font-semibold">Became Teen:</span> {nc.becameTeen ? "Yes" : "No"}
                  </div>
                </div>
                <div className="flex mt-2 justify-end space-x-2">
                  <EditNewConvertModal newConvert={nc} onSuccess={fetchData} />
                  {conversionAction(nc)}
                  {isSuperAdmin && (
                    <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded hover:bg-danger-50 transition">
                      <TrashIcon className="w-5 h-5 text-danger-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
