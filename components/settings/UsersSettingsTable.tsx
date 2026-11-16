"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import EditGeneralModal from "../generals/EditGeneralModal";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface General {
  id: string;
  name: string;
  email: string;
  role: string;
  deletedAt: string | null;
  mustChangePassword?: boolean;
  base: { name: string };
}

export default function UsersSettingsTable() {
  const toast = useToast();
  const [generals, setGenerals] = useState<General[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  // What to show the admin after creating a temp password / reset link, so they can share it.
  const [shareInfo, setShareInfo] = useState<{ title: string; name: string; secret: string; message: string } | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

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
        toast.error(`Failed to update status: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      toast.success("Status updated successfully");
      fetchGenerals(page);
    } catch (err) {
      toast.error("Failed to update status");
      console.error("Failed to update status", err);
    } finally {
      setActioningId(null);
    }
  };

  const loginUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/login` : "/auth/login";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy - select the text and copy it manually");
    }
  };

  const runAction = async (general: General, fn: () => Promise<void>) => {
    setActioningId(general.id);
    try {
      await fn();
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const errorMessage = async (res: Response) => {
    const data = await res.json().catch(() => ({}));
    return data.message || data.error || `${res.status} ${res.statusText}`;
  };

  const emailReset = (general: General) =>
    runAction(general, async () => {
      const res = await fetch(`/api/generals/${general.id}/send-reset`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res));
      toast.success(`Password reset email sent to ${general.email}`);
    });

  const resetLink = (general: General) =>
    runAction(general, async () => {
      const res = await fetch(`/api/generals/${general.id}/send-reset?mode=link`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res));
      const { resetUrl, expiresInHours } = await res.json();
      setShareInfo({
        title: "Password reset link",
        name: general.name,
        secret: resetUrl,
        message: `Hi ${general.name.split(" ")[0]}, use this link to set your password for the DA Progress Tracker (valid for ${expiresInHours} hours): ${resetUrl}`,
      });
    });

  const tempPassword = (general: General) =>
    runAction(general, async () => {
      const res = await fetch(`/api/generals/${general.id}/temp-password`, { method: "POST" });
      if (!res.ok) return void toast.error(await errorMessage(res));
      const { tempPassword, email } = await res.json();
      setShareInfo({
        title: "Temporary password",
        name: general.name,
        secret: tempPassword,
        message: `Hi ${general.name.split(" ")[0]}, sign in to the DA Progress Tracker at ${loginUrl} with email ${email} and temporary password ${tempPassword}. You'll be asked to choose your own password straight away.`,
      });
      fetchGenerals(page);
    });

  const requireAll = async () => {
    setBulkConfirm(false);
    const res = await fetch(`/api/generals/require-password-change`, { method: "POST" });
    if (!res.ok) return void toast.error(await errorMessage(res));
    const { count } = await res.json();
    toast.success(`${count} people will be asked to set a new password next time they sign in`);
    fetchGenerals(page);
  };

  const actionButtons = (general: General, mobile = false) => {
    const cls = `${mobile ? "min-h-11 md:min-h-0 " : ""}px-3 py-1 rounded-pill text-sm disabled:opacity-50`;
    const busy = actioningId === general.id;
    return (
      <>
        <EditGeneralModal general={general} onSuccess={() => fetchGenerals(page)} />
        <button onClick={() => toggleActive(general)} disabled={busy} className={`${cls} bg-warning-50 text-warning-700 hover:bg-warning-50/70`}>
          {general.deletedAt ? "Activate" : "Deactivate"}
        </button>
        {!general.deletedAt && (
          <>
            <button onClick={() => tempPassword(general)} disabled={busy} className={`${cls} bg-accent-50 text-accent-700 hover:bg-accent-100`} title="Create a one-time password to share; they must change it at sign-in">
              Temp password
            </button>
            <button onClick={() => resetLink(general)} disabled={busy} className={`${cls} bg-accent-50 text-accent-700 hover:bg-accent-100`} title="Get a 72-hour link to share on WhatsApp/SMS">
              Copy reset link
            </button>
            <button onClick={() => emailReset(general)} disabled={busy} className={`${cls} text-neutral-600 hover:bg-neutral-100`} title="Needs an email provider (Resend) configured">
              Email reset
            </button>
          </>
        )}
      </>
    );
  };

  const statusBadge = (general: General) => (
    <div className="flex flex-wrap gap-1">
      {general.deletedAt ? <Badge tone="danger">Inactive</Badge> : <Badge tone="success">Active</Badge>}
      {!general.deletedAt && general.mustChangePassword && <Badge tone="warning">Must set password</Badge>}
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-neutral-100">
        <p className="text-sm text-neutral-500 max-w-2xl">
          No email provider? Use <strong>Temp password</strong> or <strong>Copy reset link</strong> and send it on WhatsApp. People with a temporary password
          are asked to choose their own the moment they sign in.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setBulkConfirm(true)}>
          Ask everyone to set a new password
        </Button>
      </div>
      {/* Desktop Table */}
      <TableContainer className="hidden md:block border-0 shadow-none">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Base</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {generals.map((general) => (
              <TableRow key={general.id}>
                <TableCell className="font-medium text-neutral-900">{general.name}</TableCell>
                <TableCell>{general.email}</TableCell>
                <TableCell>{general.base?.name ?? "-"}</TableCell>
                <TableCell>{general.role}</TableCell>
                <TableCell>{statusBadge(general)}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="inline-flex flex-wrap justify-end gap-2">{actionButtons(general)}</div>
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
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-medium text-sm break-words leading-snug text-neutral-900">{general.name}</span>
              {statusBadge(general)}
            </div>
            <div className="flex flex-wrap gap-4 text-sm mb-2 text-neutral-600">
              <div>
                <span className="font-semibold text-neutral-700">Email:</span> {general.email}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Base:</span> {general.base?.name ?? "-"}
              </div>
              <div>
                <span className="font-semibold text-neutral-700">Role:</span> {general.role}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">{actionButtons(general, true)}</div>
          </Card>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal isOpen={!!shareInfo} onClose={() => setShareInfo(null)} title={shareInfo?.title ?? ""} size="md">
        {shareInfo && (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              For <strong>{shareInfo.name}</strong>. This is shown only once - copy it now.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-neutral-100 px-3 py-2 text-sm break-all">{shareInfo.secret}</code>
              <Button size="sm" variant="secondary" onClick={() => copy(shareInfo.secret)}>
                Copy
              </Button>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Ready-to-send message</p>
              <p className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-700">{shareInfo.message}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => copy(shareInfo.message)}>
                  Copy message
                </Button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareInfo.message)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-pill px-3 py-1.5 text-sm font-medium bg-success-50 text-success-700 hover:bg-success-50/70"
                >
                  Open in WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={bulkConfirm} onClose={() => setBulkConfirm(false)} title="Ask everyone to set a new password?" size="sm">
        <p className="text-sm text-neutral-600 mb-4">
          Every active account except yours will be asked to choose a new password the next time they sign in. Their current password still works to sign
          in.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setBulkConfirm(false)}>
            Cancel
          </Button>
          <Button onClick={requireAll}>Yes, ask everyone</Button>
        </div>
      </Modal>
    </Card>
  );
}
