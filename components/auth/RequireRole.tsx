"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import LoadingSpinner from "../common/LoadingSpinner";

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && !roles.includes(session.user.role)) {
      router.push("/dashboard");
    }
  }, [status, session, roles, router]);

  if (status === "loading" || status === "unauthenticated") return <LoadingSpinner />;
  if (!roles.includes(session!.user.role)) return <LoadingSpinner />;

  return <>{children}</>;
}
