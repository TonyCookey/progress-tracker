"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";
import AuthShell from "@/components/auth/AuthShell";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { RESET_HANDOFF_KEY } from "@/lib/authHandoff";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const handedOff = sessionStorage.getItem(RESET_HANDOFF_KEY);
      if (handedOff) {
        sessionStorage.removeItem(RESET_HANDOFF_KEY);
        setEmail(handedOff);
        setNotice("Password updated. Sign in with your new password.");
      }
    } catch {
      // storage blocked (private mode) - nothing to prefill
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", { redirect: false, email: email.trim(), password });
      if (res?.ok) {
        router.push("/dashboard");
        return;
      }
      setError("That email and password don't match. Check for typos, or ask your admin for a reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnly>
      <AuthShell title="Welcome back" subtitle="Sign in to the DA Progress Tracker">
        <form onSubmit={handleLogin} className="space-y-4">
          {notice && <p className="rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700">{notice}</p>}
          {error && (
            <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">
              {error}
            </p>
          )}

          <Input
            id="login-email"
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

          <div>
            <PasswordInput
              id="login-password"
              label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 text-right">
              <Link href="/auth/forgot-password" className="text-sm text-accent-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full" size="lg">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </AuthShell>
    </GuestOnly>
  );
}
