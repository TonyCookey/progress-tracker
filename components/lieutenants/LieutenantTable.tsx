"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { calculateAge } from "@/lib/calculateAge";
import Select from "react-select";
import { useRouter } from "next/navigation";
import LieutenantAvatar from "./AvatarImage";

export default function LieutenantTable() {
  const router = useRouter();
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
    // Redirect to the lieutenant detail page
    router.push(`/dashboard/lieutenants/${id}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex justify-between mb-4">
        {isSuperAdmin && (
          <select id="baseId" className="border rounded px-3 py-2 mt-1" onChange={(e) => setBaseId(e.target.value)} value={baseId}>
            <option value=" ">Cross Base</option>
            {bases.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
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
            className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded mx-2 hover:bg-green-200"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded shadow-sm bg-white">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Gender</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Age</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Base</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lieutenants.map((lt: any, idx: number) => (
              <tr key={lt.id} className={`border-t transition-colors hover:bg-blue-50 ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                <td className="px-4 pb-2 flex items-center gap-3">
                  {/* Avatar with initials or image */}
                  {lt.imageKey ? (
                    <LieutenantAvatar imageKey={lt.imageKey} alt={`${lt.name}'s profile`} size={32} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {lt.name?.charAt(0) ?? "L"}
                    </div>
                  )}
                  <span className="font-medium">{lt.name}</span>
                </td>
                <td className="px-4 pb-2">{lt.gender}</td>
                <td className="px-4 pb-2">{calculateAge(lt.dateOfBirth)} yrs</td>
                <td className="px-4 pb-2">{lt.base?.name ?? "-"}</td>
                <td className="px-4 pb-2 flex space-x-2">
                  <button onClick={() => handleView(lt.id)} title="View" className="p-2 rounded hover:bg-blue-100 transition">
                    <EyeIcon className="w-5 h-5 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
