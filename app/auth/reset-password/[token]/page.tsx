"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to reset password");
        return;
      }
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnly>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-4 text-center text-neutral-900">Reset Password</h2>

            {error && <p className="text-danger-500 text-sm mb-3">{error}</p>}

            <div className="mb-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="mb-6">
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            <p className="text-center text-sm mt-4">
              <Link href="/auth/login" className="text-accent-600 hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </GuestOnly>
  );
}
