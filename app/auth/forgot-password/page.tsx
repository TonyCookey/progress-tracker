"use client";

import { useState } from "react";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestOnly>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 text-center text-neutral-900">Forgot Password</h2>

          {submitted ? (
            <p className="text-center text-neutral-600">If that email exists, a reset link has been sent. Please check your inbox.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" isLoading={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm mt-4">
            <Link href="/auth/login" className="text-accent-600 hover:underline">
              Back to login
            </Link>
          </p>
        </Card>
      </div>
    </GuestOnly>
  );
}
