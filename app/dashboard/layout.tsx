import { ReactNode } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/navigation/Topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="w-full min-h-screen bg-gray-50 pt-16 md:ml-64 transition-all">
        <Topbar />
        <div className="px-4 md:px-6 mt-6">{children}</div>
      </main>
    </div>
  );
}
