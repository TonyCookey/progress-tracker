"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GuestOnly from "@/components/auth/GuestOnly";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <GuestOnly>
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <Card className="w-full max-w-md">
          <form onSubmit={handleLogin}>
            <h2 className="text-2xl font-bold mb-4 text-center text-neutral-900">Login</h2>

            {error && <p className="text-danger-500 text-sm mb-3">{error}</p>}

            <div className="mb-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="mb-6">
              <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>

            <p className="text-center text-sm mt-4">
              <Link href="/auth/forgot-password" className="text-accent-600 hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </GuestOnly>
  );
}
