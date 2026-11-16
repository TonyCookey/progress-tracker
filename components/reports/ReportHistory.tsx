"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowDownTrayIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { Table, TableContainer, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import type { ReportSelection } from "@/components/reports/MonthlyReportBuilder";

type ReportRow = {
  id: string;
  baseId: string;
  month: number;
  year: number;
  status: "DRAFT" | "FINAL";
  generatedAt: string;
  updatedAt: string;
  generatedByName: string | null;
  archived: boolean;
  base: { name: string; label: string | null };
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

// A FINAL report edited after it was generated: the downloadable file predates the edits.
const editedSinceGenerated = (r: ReportRow) => r.status === "FINAL" && new Date(r.updatedAt).getTime() - new Date(r.generatedAt).getTime() > 60_000;

export default function ReportHistory({ onOpen, refreshKey }: { onOpen: (selection: ReportSelection) => void; refreshKey?: number }) {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);
  const [baseId, setBaseId] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((r) => r.json())
        .then(setBases);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!user) return;
    const scope = isSuperAdmin ? baseId : user.baseId;
    setLoading(true);
    fetch(`/api/reports/monthly${scope ? `?baseId=${scope}` : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { reports: [] }))
      .then((data) => setReports(data.reports ?? []))
      .finally(() => setLoading(false));
  }, [user, isSuperAdmin, baseId, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Every report you save or generate is kept here. Download the PowerPoint again at any time, or open it to keep editing.
        </p>
        {isSuperAdmin && (
          <Select value={baseId} onChange={(e) => setBaseId(e.target.value)} className="sm:w-48" aria-label="Base">
            <option value="">All bases</option>
            {bases.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading reports…</p>
      ) : !reports.length ? (
        <EmptyState title="No reports yet" description="Reports appear here once you save a draft or generate a .pptx in the builder." />
      ) : (
        <>
          <TableContainer className="hidden md:block">
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Month</TableHeaderCell>
                  {isSuperAdmin && <TableHeaderCell>Base</TableHeaderCell>}
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Last change</TableHeaderCell>
                  <TableHeaderCell>By</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-neutral-900">
                      {MONTHS[r.month - 1]} {r.year}
                    </TableCell>
                    {isSuperAdmin && <TableCell>{r.base.name}</TableCell>}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge tone={r.status === "FINAL" ? "success" : "warning"} size="sm">
                          {r.status === "FINAL" ? "Generated" : "Draft"}
                        </Badge>
                        {editedSinceGenerated(r) && <span className="text-xs text-warning-700">edited since</span>}
                      </div>
                    </TableCell>
                    <TableCell>{fmt(r.status === "FINAL" && !editedSinceGenerated(r) ? r.generatedAt : r.updatedAt)}</TableCell>
                    <TableCell>{r.generatedByName ?? "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <ReportActions report={r} onOpen={onOpen} />
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </TableContainer>
          <div className="md:hidden space-y-3">
            {reports.map((r) => (
              <Card key={r.id} padded className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-neutral-900">
                    {MONTHS[r.month - 1]} {r.year}
                    {isSuperAdmin && <span className="text-neutral-500 font-normal"> · {r.base.name}</span>}
                  </p>
                  <Badge tone={r.status === "FINAL" ? "success" : "warning"} size="sm">
                    {r.status === "FINAL" ? "Generated" : "Draft"}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500">
                  {fmt(r.updatedAt)} {r.generatedByName ? `· ${r.generatedByName}` : ""}
                </p>
                <ReportActions report={r} onOpen={onOpen} />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReportActions({ report, onOpen }: { report: ReportRow; onOpen: (s: ReportSelection) => void }) {
  return (
    <div className="inline-flex items-center gap-2">
      <a
        href={`/api/reports/monthly/${report.id}/download`}
        className="inline-flex items-center gap-1.5 rounded-pill bg-accent-50 px-3 py-1.5 text-sm font-medium text-accent-700 hover:bg-accent-100 transition-colors"
        title={report.status === "FINAL" ? "Download the generated PowerPoint" : "Download a PowerPoint built from this draft"}
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        {report.status === "FINAL" ? "Download" : "Download draft"}
      </a>
      <button
        type="button"
        onClick={() => onOpen({ baseId: report.baseId, month: report.month, year: report.year })}
        className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
      >
        <PencilSquareIcon className="w-4 h-4" />
        Open
      </button>
    </div>
  );
}
