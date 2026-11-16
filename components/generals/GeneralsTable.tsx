"use client";

import { useEffect, useState } from "react";
import { EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import Link from "next/link";
import { Table, TableContainer, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import PersonAvatar from "@/components/ui/PersonAvatar";
import Card from "@/components/ui/Card";

interface General {
  id: string;
  name: string;
  email: string;
  imageKey?: string | null;
  role?: string;
  base: {
    name: string;
  };
}

const ROLE_LABEL: Record<string, string> = { SUPERADMIN: "Superadmin", GENERAL: "General", COLONEL: "Colonel", VOLUNTEER: "Volunteer" };

const filterClass =
  "border border-neutral-300 rounded-lg px-3 py-2 w-full sm:w-auto text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors bg-white";

export default function GeneralsTable({ initialRole = "", initialBaseId = "" }: { initialRole?: string; initialBaseId?: string }) {
  const [generals, setGenerals] = useState<General[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [baseId, setBaseId] = useState(initialBaseId);
  const [search, setSearch] = useState("");
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/bases")
      .then((res) => (res.ok ? res.json() : []))
      .then(setBases);
  }, []);

  const fetchGenerals = async (currentPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), role, baseId, search });
      const res = await fetch(`/api/generals?${params}`);
      const data = await res.json();
      setGenerals(data.generals ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error("Failed to fetch generals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerals(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role, baseId, search]);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <select aria-label="Base" className={filterClass} value={baseId} onChange={(e) => resetPage(setBaseId)(e.target.value)}>
          <option value="">All bases</option>
          {bases.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select aria-label="Role" className={filterClass} value={role} onChange={(e) => resetPage(setRole)(e.target.value)}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => resetPage(setSearch)(e.target.value)}
          className="border border-neutral-300 px-3 py-2 rounded-lg w-full sm:w-64 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
        />
        <span className="text-sm text-neutral-500 sm:ml-auto">{total} {total === 1 ? "person" : "people"}</span>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop Table */}
          <TableContainer className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Base</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {generals.map((general) => (
                  <TableRow key={general.id}>
                    <TableCell className="flex items-center gap-3">
                      {general.imageKey ? (
                        <PersonAvatar imageKey={general.imageKey} alt={`${general.name}'s profile`} size={32} />
                      ) : (
                        <Avatar name={general.name ?? "G"} size="sm" />
                      )}
                      <span className="font-medium text-neutral-900">{general.name}</span>
                    </TableCell>
                    <TableCell>{general.email}</TableCell>
                    <TableCell>{ROLE_LABEL[general.role ?? ""] ?? general.role ?? "-"}</TableCell>
                    <TableCell>{general.base?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/generals/${general.id}`} className="inline-flex">
                        <EyeIcon className="w-5 h-5 text-accent-600 cursor-pointer" />
                      </Link>
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
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={general.name ?? "G"} size="sm" />
                  <span className="font-medium text-sm break-words leading-snug text-neutral-900">{general.name}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
                  <div>
                    <span className="font-semibold text-neutral-700">Email:</span> {general.email}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700">Base:</span> {general.base?.name ?? "-"}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Link href={`/dashboard/generals/${general.id}`} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                    <ArrowRightIcon className="w-5 h-5 text-accent-600" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
