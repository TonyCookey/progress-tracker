"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { EyeIcon, ArrowPathIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { calculateAge } from "@/lib/calculateAge";
import { useRouter } from "next/navigation";
import PersonAvatar from "@/components/ui/PersonAvatar";
import { Table, TableContainer, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";

const STATUS_LABEL: Record<string, string> = { ACTIVE: "Active", INACTIVE: "Inactive", LEFT: "Left" };

const filterClass =
  "border border-neutral-300 rounded-lg px-3 py-2 w-full sm:w-auto text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors bg-white";

export default function LieutenantTable({ initialBaseId = "", initialStatus = "" }: { initialBaseId?: string; initialStatus?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const [lieutenants, setLieutenants] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  // "" = all bases (superadmin only; everyone else is scoped to their base server-side).
  const [baseId, setBaseId] = useState(initialBaseId);
  const [rank, setRank] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
  }, [isSuperAdmin]);

  const limit = 10;
  const fetchData = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), search, baseId, rank, status });
    setLoading(true);
    try {
      const res = await fetch(`/api/lieutenants?${params}`, { cache: "no-store" });
      const { data, total } = await res.json();
      setLieutenants(data ?? []);
      setTotal(total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, page, search, baseId, rank, status]);

  const handleView = (id: string) => {
    router.push(`/dashboard/lieutenants/${id}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {isSuperAdmin && (
            <select
              id="baseId"
              aria-label="Base"
              className={filterClass}
              onChange={(e) => {
                setBaseId(e.target.value);
                setPage(1);
              }}
              value={baseId}
            >
              <option value="">All bases</option>
              {bases.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Rank"
            className={filterClass}
            value={rank}
            onChange={(e) => {
              setRank(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All ranks</option>
            <option value="LIEUTENANT">Lieutenant</option>
            <option value="CAPTAIN">Captain</option>
          </select>
          <select
            aria-label="Status"
            className={filterClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LEFT">Left</option>
          </select>
        </div>
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
            onClick={() => fetchData()}
            className="flex items-center px-4 py-2 bg-accent-50 text-accent-700 rounded-pill hover:bg-accent-100 w-full sm:w-auto justify-center transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>
      <p className="text-sm text-neutral-500 mb-3">
        {loading ? "Loading…" : `${total} ${total === 1 ? "teen" : "teens"}`}
      </p>

      {/* Table for desktop, cards for mobile */}
      <div>
        {/* Desktop Table */}
        <TableContainer className="hidden md:block">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Rank</TableHeaderCell>
                <TableHeaderCell>Gender</TableHeaderCell>
                <TableHeaderCell>Age</TableHeaderCell>
                <TableHeaderCell>Base</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {lieutenants.map((lt: any) => (
                <TableRow key={lt.id}>
                  <TableCell className="flex items-center gap-3">
                    {lt.imageKey ? (
                      <PersonAvatar imageKey={lt.imageKey} alt={`${lt.name}'s profile`} size={32} />
                    ) : (
                      <Avatar name={lt.name ?? "L"} size="sm" />
                    )}
                    <span className="font-medium text-neutral-900">{lt.name}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 rounded-pill text-xs font-medium ${
                        lt.rank === "CAPTAIN" ? "bg-accent-100 text-accent-700" : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {lt.rank === "CAPTAIN" ? "Captain" : "Lieutenant"}
                    </span>
                  </TableCell>
                  <TableCell>{lt.gender}</TableCell>
                  <TableCell>{calculateAge(lt.dateOfBirth)} yrs</TableCell>
                  <TableCell>{lt.base?.name ?? "-"}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${lt.status === "ACTIVE" ? "text-success-700" : "text-neutral-500"}`}>
                      {STATUS_LABEL[lt.status] ?? lt.status}
                    </span>
                  </TableCell>
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
                  <PersonAvatar imageKey={lt.imageKey} alt={`${lt.name}'s profile`} size={32} />
                ) : (
                  <Avatar name={lt.name ?? "L"} size="sm" />
                )}
                <span className="font-medium text-sm text-neutral-900">{lt.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-pill text-xs font-medium ${
                    lt.rank === "CAPTAIN" ? "bg-accent-100 text-accent-700" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {lt.rank === "CAPTAIN" ? "Captain" : "Lieutenant"}
                </span>
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

      {!loading && lieutenants.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-10">No teens match these filters.</p>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
