"use client";

import { useState } from "react";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";
import AuthShell from "@/components/auth/AuthShell";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, message: data.message || "Something went wrong. Try again." });
      } else if (data.emailConfigured === false) {
        setResult({ ok: false, message: data.message });
      } else {
        setResult({ ok: true, message: "If that email has an account, a reset link is on its way. It works once and expires in 1 hour." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnly>
      <AuthShell title="Forgot your password?" subtitle="Enter the email you sign in with.">
        {result?.ok ? (
          <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">{result.message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {result && <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{result.message}</p>}
            <Input
              id="forgot-email"
              label="Email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" isLoading={loading} className="w-full" size="lg">
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="text-center text-sm mt-4">
          <Link href="/auth/login" className="text-accent-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </AuthShell>
    </GuestOnly>
  );
}
