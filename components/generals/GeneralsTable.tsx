"use client";

import { useEffect, useState } from "react";
import { PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import Link from "next/link";

interface General {
  id: string;
  name: string;
  email: string;
  base: {
    name: string;
  };
}

export default function GeneralsTable() {
  const [generals, setGenerals] = useState<General[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchGenerals = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/generals?page=${currentPage}`);
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
  }, [page]);
  return (
    <div className="overflow-x-auto shadow rounded p-4">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Base</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {generals.map((general, idx) => (
                <tr key={general.id} className={`border-t transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    {/* Avatar with initials */}
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {general.name?.charAt(0) ?? "G"}
                    </div>
                    <span className="font-medium">{general.name}</span>
                  </td>
                  <td className="px-4 py-3">{general.email}</td>
                  <td className="px-4 py-3">{general.base?.name ?? "-"}</td>
                  <td className="px-4 py-3 flex justify-end space-x-2">
                    <Link href={`/dashboard/generals/${general.id}`}>
                      <EyeIcon className="w-5 h-5 text-blue-600 cursor-pointer" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
