"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { PencilIcon, TrashIcon, EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { calculateAge } from "@/lib/calculateAge";
import Select from "react-select";
import { set } from "date-fns";

export default function LieutenantTable() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const [lieutenants, setLieutenants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [baseId, setBaseId] = useState(user?.baseId);
  const [bases, setBases] = useState([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);

      setBaseId(user?.baseId);
    }
  }, [isSuperAdmin, user?.baseId]);

  const limit = 10;
  const fetchData = async (page: number, search: string, baseId: any) => {
    console.log("Fetching data with:", { page, search, baseId });
    const res = await fetch(`/api/lieutenants?page=${page}&limit=${limit}&search=${search}&baseId=${baseId}`, { cache: "no-store" });
    const { data, total } = await res.json();
    setLieutenants(data);
    setTotal(total);
  };

  useEffect(() => {
    if (baseId) {
      fetchData(page, search, baseId);
    }
  }, [page, search, baseId]);
  const handleView = (id: string) => {
    console.log("View Lieutenant", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit Lieutenant", id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Lieutenant?")) return;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex justify-between mb-4">
        {isSuperAdmin && (
          <Select
            options={bases.map((base: any) => ({ label: base.name, value: base.id }))}
            onChange={(option) => setBaseId(option?.value)}
            value={bases.map((base: any) => ({ label: base.name, value: base.id })).find((option) => option.value === baseId)}
            placeholder="Select Base"
            className="w-64"
          />
        )}
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border px-3 py-2 rounded w-64"
          />
          <button
            onClick={() => {
              setPage(1);
              setSearch("");
              fetchData(1, search, baseId);
            }}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded mx-2 hover:bg-green-600"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Gender</th>
              <th className="text-left px-4 py-2">Age</th>
              <th className="text-left px-4 py-2">Base</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lieutenants.map((lt: any) => (
              <tr key={lt.id} className="border-t">
                <td className="px-4 py-2">{lt.name}</td>
                <td className="px-4 py-2">{lt.gender}</td>
                <td className="px-4 py-2">{calculateAge(lt.dateOfBirth)} years</td>
                <td className="px-4 py-2">{lt.base?.name ?? "-"}</td>
                <td className="px-4 py-2 space-x-2">
                  <button onClick={() => handleView(lt.id)} title="View">
                    <EyeIcon className="w-5 h-5 text-blue-600" />
                  </button>
                  <button onClick={() => handleEdit(lt.id)} title="Edit">
                    <PencilIcon className="w-5 h-5 text-yellow-600" />
                  </button>
                  <button onClick={() => handleDelete(lt.id)} title="Delete">
                    <TrashIcon className="w-5 h-5 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
          Previous
        </button>
        <span className="px-2 py-1">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
