"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>

          {error && <p className="text-red-500 text-md mb-3">{error}</p>}

          <div className="mb-4">
            <label className="block mb-1">New Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full border px-3 py-2 rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <p className="text-center text-sm mt-4">
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </GuestOnly>
  );
}
