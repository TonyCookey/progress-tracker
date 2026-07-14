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
      <Link href={`/dashboard/lieutenants/${nc.teenId}`} title="View Teen" className="p-2 rounded hover:bg-blue-100 transition">
        <ArrowRightIcon className="w-5 h-5 text-blue-600" />
      </Link>
    ) : (
      <ConvertToTeenModal newConvertId={nc.id} onSuccess={fetchData} />
    );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          {isSuperAdmin && (
            <select
              value={baseId}
              onChange={(e) => {
                setBaseId(e.target.value);
                setPage(1);
              }}
              className="border rounded px-3 py-2 w-full sm:w-auto"
            >
              <option value="">All Bases</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded w-full sm:w-64"
          />
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded sm:mx-2 hover:bg-green-200 w-full sm:w-auto justify-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
        <CreateNewConvertModal onSuccess={fetchData} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border rounded shadow-sm bg-white">
            <table className="w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Gender</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Base</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Followed Up</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Became Teen</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {newConverts.map((nc, idx) => (
                  <tr key={nc.id} className={`border-t transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                    <td className="px-4 py-3 font-medium">{nc.name}</td>
                    <td className="px-4 py-3">{nc.gender ?? "-"}</td>
                    <td className="px-4 py-3">{formatDate(nc.date)}</td>
                    <td className="px-4 py-3">{nc.base?.name ?? "Cross Base"}</td>
                    <td className="px-4 py-3">{nc.followedUp ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : "-"}</td>
                    <td className="px-4 py-3">{nc.becameTeen ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : "-"}</td>
                    <td className="px-4 py-3 flex space-x-2">
                      <EditNewConvertModal newConvert={nc} onSuccess={fetchData} />
                      {conversionAction(nc)}
                      {isSuperAdmin && (
                        <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded hover:bg-red-100 transition">
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {newConverts.map((nc) => (
              <div key={nc.id} className="border rounded shadow-sm bg-white p-4 flex flex-col gap-2">
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
                    <button onClick={() => handleDelete(nc.id)} title="Delete" className="p-2 rounded hover:bg-red-100 transition">
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4 space-x-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
        >
          Previous
        </button>
        <span className="px-2 py-1 font-medium text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
