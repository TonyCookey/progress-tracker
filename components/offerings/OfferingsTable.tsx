"use client";
import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatMoney";
import UiSelect from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

export default function OfferingsTable() {
  const toast = useToast();
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const canEditOffering = user?.role === "SUPERADMIN" || user?.role === "GENERAL";
  const [offerings, setOfferings] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState("");
  // "" = all bases, "cross-base" = offerings with no base; non-superadmins are scoped server-side.
  const [baseId, setBaseId] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [bases, setBases] = useState([]);
  const [offeringTypes, setOfferingTypes] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    }
    fetch("/api/refdata?category=offering_type")
      .then((res) => (res.ok ? res.json() : []))
      .then(setOfferingTypes);
  }, [isSuperAdmin]);

  const limit = 10;
  const fetchData = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), search, baseId, type, from, to });
    const res = await fetch(`/api/offerings?${params}`, { cache: "no-store" });
    const { offerings, total, totalAmount } = await res.json();
    setOfferings(offerings ?? []);
    setTotal(total ?? 0);
    setTotalAmount(totalAmount ?? 0);
  };

  useEffect(() => {
    if (user) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, page, search, baseId, type, from, to]);

  const withReset = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offering?")) return;
    const res = await fetch(`/api/offerings/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to delete offering");
      return;
    }
    toast.success("Offering deleted successfully");
    fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap mb-4">
        {isSuperAdmin && (
          <UiSelect id="baseId" label="Base" className="lg:w-44" onChange={(e) => withReset(setBaseId)(e.target.value)} value={baseId}>
            <option value="">All bases</option>
            {bases.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            <option value="cross-base">Cross-base only</option>
          </UiSelect>
        )}
        <UiSelect id="type" label="Type" className="lg:w-40" onChange={(e) => withReset(setType)(e.target.value)} value={type}>
          <option value="">All types</option>
          {offeringTypes.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </UiSelect>
        <Input type="date" label="From" value={from} onChange={(e) => withReset(setFrom)(e.target.value)} className="lg:w-40" />
        <Input type="date" label="To" value={to} onChange={(e) => withReset(setTo)(e.target.value)} className="lg:w-40" />
        <Input
          type="text"
          label="Search"
          placeholder="Service name..."
          value={search}
          onChange={(e) => withReset(setSearch)(e.target.value)}
          className="lg:w-56"
        />
        <Button variant="secondary" className="w-full lg:w-auto" onClick={() => fetchData()}>
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-neutral-500">
          {total} {total === 1 ? "offering" : "offerings"}
        </span>
        <span className="text-neutral-700">
          Total: <span className="font-bold text-success-700">{formatMoney(totalAmount)}</span>
        </span>
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
