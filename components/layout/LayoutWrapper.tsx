"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/navigation/Topbar";

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideLayout = pathname === "/auth/login" || pathname === "/register" || pathname === "/";

  if (hideLayout) return <>{children}</>;

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 w-full min-h-screen bg-gray-50 pt-16">
        <Topbar />
        <div className="px-6 mt-6">{children}</div>
      </main>
    </div>
  );
}
