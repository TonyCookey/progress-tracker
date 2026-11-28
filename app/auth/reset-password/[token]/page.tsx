"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { RESET_HANDOFF_KEY } from "@/lib/authHandoff";

type TokenState = "loading" | "valid" | "used" | "expired" | "invalid";

const DEAD_LINK_COPY: Record<Exclude<TokenState, "loading" | "valid">, { title: string; body: string }> = {
  used: {
    title: "This link has already been used",
    body: "Each reset link works once, and creating a new link cancels older ones. If you already set a password, just sign in. Otherwise ask your admin for a fresh link.",
  },
  expired: {
    title: "This link has expired",
    body: "Ask your admin for a new reset link, then open it soon after you receive it.",
  },
  invalid: {
    title: "This link isn't valid",
    body: "It may have been copied incompletely. Make sure you opened the whole link, or ask your admin for a new one.",
  },
};

// Deliberately not wrapped in GuestOnly: someone already signed in on this device (e.g. the
// admin testing the link, or a shared phone) must still be able to use it instead of being
// bounced to the dashboard. Any session here is ended once the reset succeeds.
export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { status } = useSession();
  const [tokenState, setTokenState] = useState<TokenState>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(params.token)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setTokenState(d.state ?? "invalid");
        setEmail(d.email ?? null);
      })
      .catch(() => setTokenState("invalid"));
  }, [params.token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords don't match.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Couldn't reset your password. Ask your admin for a new link.");
        return;
      }
      try {
        if (data.email) sessionStorage.setItem(RESET_HANDOFF_KEY, data.email);
      } catch {
        // storage blocked - login just won't be prefilled
      }
      if (status === "authenticated") await signOut({ redirect: false });
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  if (tokenState === "loading") {
    return (
      <AuthShell title="Reset password">
        <LoadingSpinner />
      </AuthShell>
    );
  }

  if (tokenState !== "valid") {
    const copy = DEAD_LINK_COPY[tokenState];
    return (
      <AuthShell title={copy.title}>
        <p className="text-sm text-neutral-600">{copy.body}</p>
        <Link href="/auth/login" className="mt-6 block w-full rounded-pill bg-accent-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-accent-600">
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle={
        email ? (
          <>
            For <strong className="text-neutral-700">{email}</strong> - you&apos;ll sign in with this email.
          </>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {error}
          </p>
        )}
        {/* Lets password managers save the new password against the right account. */}
        <input type="email" name="username" autoComplete="username" value={email ?? ""} readOnly hidden />
        <PasswordInput
          id="reset-new"
          label="New password"
          hint="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          revealed={revealed}
          onRevealedChange={setRevealed}
          required
        />
        <PasswordInput
          id="reset-confirm"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          revealed={revealed}
          onRevealedChange={setRevealed}
          required
        />
        <Button type="submit" isLoading={loading} className="w-full" size="lg">
          {loading ? "Saving..." : "Save password"}
        </Button>
        <p className="text-center text-sm">
          <Link href="/auth/login" className="text-accent-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
