"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import EditGeneralModal from "../generals/EditGeneralModal";

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
    <div className="shadow rounded p-2 sm:p-4">
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Base</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {generals.map((general, idx) => (
              <tr key={general.id} className={`border-t ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td className="px-4 py-3 font-medium">{general.name}</td>
                <td className="px-4 py-3">{general.email}</td>
                <td className="px-4 py-3">{general.base?.name ?? "-"}</td>
                <td className="px-4 py-3">{general.role}</td>
                <td className="px-4 py-3">
                  {general.deletedAt ? (
                    <span className="text-red-600 font-medium">Inactive</span>
                  ) : (
                    <span className="text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <EditGeneralModal general={general} onSuccess={() => fetchGenerals(page)} />
                  <button
                    onClick={() => toggleActive(general)}
                    disabled={actioningId === general.id}
                    className="px-3 py-1 rounded text-sm bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                  >
                    {general.deletedAt ? "Activate" : "Deactivate"}
                  </button>
                  <button
                    onClick={() => sendReset(general)}
                    disabled={actioningId === general.id}
                    className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                  >
                    Send Password Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
    </div>
  );
}
