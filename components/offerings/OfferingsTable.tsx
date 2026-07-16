"use client";
import { useEffect, useState } from "react";
import { EyeIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatMoney";
import UiSelect from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";

export default function OfferingsTable() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const canEditOffering = user?.role === "SUPERADMIN" || user?.role === "GENERAL";
  const [offerings, setOfferings] = useState([]);
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
    const res = await fetch(`/api/offerings?page=${page}&limit=${limit}&search=${search}&baseId=${baseId}`, { cache: "no-store" });
    const { offerings, total } = await res.json();
    setOfferings(offerings);
    setTotal(total);
  };

  useEffect(() => {
    if (baseId) {
      fetchData(page, search, baseId);
    }
  }, [page, search, baseId]);

  const handleView = (id: string) => {
    router.push(`/dashboard/offerings/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offering?")) return;
    const res = await fetch(`/api/offerings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete offering");
      return;
    }
    fetchData(page, search, baseId);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        {isSuperAdmin && (
          <UiSelect
            id="baseId"
            className="sm:w-auto"
            onChange={(e) => setBaseId(e.target.value)}
            value={baseId}
          >
            <option value=" ">Cross Base</option>
            {bases.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </UiSelect>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by service..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="sm:w-64"
          />
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              setPage(1);
              setSearch("");
              fetchData(1, search, baseId);
            }}
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table for desktop, cards for mobile */}
      <div>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Service</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Base</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  {canEditOffering && <TableHeaderCell>Actions</TableHeaderCell>}
                </tr>
              </TableHead>
              <tbody>
                {offerings.map((off: any) => (
                  <TableRow key={off.id}>
                    <TableCell className="font-medium">{off.service}</TableCell>
                    <TableCell className="font-bold text-success-700">{formatMoney(Number(off.amount))}</TableCell>
                    <TableCell>{formatDate(off.date)}</TableCell>
                    <TableCell>{off.base?.name ?? "-"}</TableCell>
                    <TableCell>{off.type === "Online" ? "Transfer" : off.type ?? "-"}</TableCell>
                    {canEditOffering && (
                      <TableCell className="space-x-2">
                        <Link href={`/dashboard/offerings/${off.id}/edit`} className="text-accent-600 hover:underline">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(off.id)} className="text-danger-500 hover:underline">
                          Delete
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </div>
        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {offerings.map((off: any) => (
            <Card key={off.id} padded className="flex flex-col gap-2">
              <div className="mb-2">
                <span className="block font-medium text-sm break-words leading-snug mb-1">{off.service}</span>
                <span className="block font-bold text-success-700 text-base mb-1">{formatMoney(Number(off.amount))}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm mb-2">
                <div>
                  <span className="font-semibold">Date:</span> {formatDate(off.date)}
                </div>
                <div>
                  <span className="font-semibold">Base:</span> {off.base?.name ?? "-"}
                </div>
                <div>
                  <span className="font-semibold">Type:</span> {off.type === "Online" ? "Transfer" : off.type ?? "-"}
                </div>
              </div>
              {canEditOffering && (
                <div className="flex gap-4 text-sm">
                  <Link href={`/dashboard/offerings/${off.id}/edit`} className="text-accent-600 hover:underline">
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(off.id)} className="text-danger-500 hover:underline">
                    Delete
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
