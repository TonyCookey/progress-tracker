"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { EyeIcon, ArrowPathIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { calculateAge } from "@/lib/calculateAge";
import { useRouter } from "next/navigation";
import LieutenantAvatar from "./AvatarImage";
import { Table, TableContainer, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";

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
    // Redirect to the lieutenant detail page
    router.push(`/dashboard/lieutenants/${id}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        {isSuperAdmin && (
          <select
            id="baseId"
            className="border border-neutral-300 rounded-lg px-3 py-2 mt-1 w-full sm:w-auto text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors bg-white"
            onChange={(e) => setBaseId(e.target.value)}
            value={baseId}
          >
            <option value=" ">Cross Base</option>
            {bases.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border border-neutral-300 px-3 py-2 rounded-lg w-full sm:w-64 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors"
          />
          <button
            onClick={() => {
              setPage(1);
              setSearch("");
              fetchData(1, search, baseId);
            }}
            className="flex items-center px-4 py-2 bg-accent-50 text-accent-700 rounded-pill sm:mx-2 hover:bg-accent-100 w-full sm:w-auto justify-center transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Table for desktop, cards for mobile */}
      <div>
        {/* Desktop Table */}
        <TableContainer className="hidden md:block">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Gender</TableHeaderCell>
                <TableHeaderCell>Age</TableHeaderCell>
                <TableHeaderCell>Base</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {lieutenants.map((lt: any) => (
                <TableRow key={lt.id}>
                  <TableCell className="flex items-center gap-3">
                    {lt.imageKey ? (
                      <LieutenantAvatar imageKey={lt.imageKey} alt={`${lt.name}'s profile`} size={32} />
                    ) : (
                      <Avatar name={lt.name ?? "L"} size="sm" />
                    )}
                    <span className="font-medium text-neutral-900">{lt.name}</span>
                  </TableCell>
                  <TableCell>{lt.gender}</TableCell>
                  <TableCell>{calculateAge(lt.dateOfBirth)} yrs</TableCell>
                  <TableCell>{lt.base?.name ?? "-"}</TableCell>
                  <TableCell>
                    <button onClick={() => handleView(lt.id)} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                      <EyeIcon className="w-5 h-5 text-accent-600" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {lieutenants.map((lt: any) => (
            <Card key={lt.id} padded className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-2">
                {lt.imageKey ? (
                  <LieutenantAvatar imageKey={lt.imageKey} alt={`${lt.name}'s profile`} size={32} />
                ) : (
                  <Avatar name={lt.name ?? "L"} size="sm" />
                )}
                <span className="font-medium text-sm text-neutral-900">{lt.name}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                <div>
                  <span className="font-semibold text-neutral-700">Gender:</span> {lt.gender}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Age:</span> {calculateAge(lt.dateOfBirth)} yrs
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Base:</span> {lt.base?.name ?? "-"}
                </div>
              </div>
              <div className="flex mt-2 justify-end">
                <button onClick={() => handleView(lt.id)} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                  <ArrowRightIcon className="w-5 h-5 text-accent-600" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
