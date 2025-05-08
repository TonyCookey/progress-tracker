"use client";
import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import { calculateAge } from "@/lib/calculateAge";
export default function LieutenantTable() {
  const [lieutenants, setLieutenants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/lieutenants?page=${page}&limit=${limit}&search=${search}`);
      const { data, total } = await res.json();
      setLieutenants(data);
      setTotal(total);
    };

    fetchData();
  }, [page, search]);
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
      <div className="flex justify-end mb-4">
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
