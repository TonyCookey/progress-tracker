"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GuestOnly from "@/components/auth/GuestOnly";

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

          {error && <p className="text-red-500 text-md mb-3">{error}</p>}

          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input type="email" className="w-full border px-3 py-2 rounded" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="mb-6">
            <label className="block mb-1">Password</label>
            <input type="password" className="w-full border px-3 py-2 rounded" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Sign In
          </button>
        </form>
      </div>
    </GuestOnly>
  );
}
