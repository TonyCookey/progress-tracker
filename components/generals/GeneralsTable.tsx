"use client";

import { useEffect, useState } from "react";
import { EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../common/LoadingSpinner";
import Link from "next/link";
import { Table, TableContainer, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import Pagination from "@/components/ui/Pagination";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";

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
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop Table */}
          <TableContainer className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Base</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {generals.map((general) => (
                  <TableRow key={general.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar name={general.name ?? "G"} size="sm" />
                      <span className="font-medium text-neutral-900">{general.name}</span>
                    </TableCell>
                    <TableCell>{general.email}</TableCell>
                    <TableCell>{general.base?.name ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/generals/${general.id}`} className="inline-flex">
                        <EyeIcon className="w-5 h-5 text-accent-600 cursor-pointer" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {generals.map((general) => (
              <Card key={general.id} padded className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar name={general.name ?? "G"} size="sm" />
                  <span className="font-medium text-sm break-words leading-snug text-neutral-900">{general.name}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
                  <div>
                    <span className="font-semibold text-neutral-700">Email:</span> {general.email}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-700">Base:</span> {general.base?.name ?? "-"}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Link href={`/dashboard/generals/${general.id}`} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                    <ArrowRightIcon className="w-5 h-5 text-accent-600" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
