"use client";

import { ReactNode, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// Blocks the dashboard until an account flagged `mustChangePassword` (admin-created,
// or given a temporary password) picks its own password. Works without any email
// provider: the admin shares the temporary password, the person signs in and lands here.
export default function PasswordChangeGate({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Render nothing until the session is known, so flagged accounts never get the page
  // (or its server-rendered numbers) even for a moment.
  if (status === "loading") return null;
  if (!session?.user?.mustChangePassword) return <>{children}</>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) return setError("Use at least 8 characters.");
    if (newPassword !== confirmPassword) return setError("The new passwords don't match.");
    if (newPassword === oldPassword) return setError("Choose a password different from the temporary one.");
    setSaving(true);
    try {
      const res = await fetch(`/api/generals/${session.user.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || data.error || "Couldn't update your password.");
        return;
      }
      await update();
      // The server layout withheld the page while the flag was set - re-render it now.
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-bold text-neutral-900">Set your own password</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Welcome{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! You signed in with a password someone else gave you. Choose a new one only you
          know to continue.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Input
            id="gate-old"
            label="Current (temporary) password"
            type={show ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            id="gate-new"
            label="New password"
            hint="At least 8 characters"
            type={show ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            id="gate-confirm"
            label="Confirm new password"
            type={show ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Show passwords
          </label>
          {error && <p className="text-sm text-danger-500">{error}</p>}
          <Button type="submit" className="w-full" isLoading={saving} disabled={saving}>
            Save and continue
          </Button>
          <button type="button" onClick={() => signOut({ callbackUrl: "/auth/login" })} className="w-full text-sm text-neutral-500 hover:text-neutral-800">
            Sign out
          </button>
        </form>
      </Card>
    </div>
  );
}
