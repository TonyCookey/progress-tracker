import { ReactNode } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Topbar from "@/components/navigation/Topbar";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Accounts that must replace a shared/temporary password get only the change-password
  // screen: page content isn't even sent to the browser until they do.
  const session = await getSession();
  const mustChangePassword = !!session?.user?.mustChangePassword;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="w-full min-w-0 min-h-screen bg-neutral-50 pt-16 lg:ml-64 transition-all">
        <Topbar />
        <div className="mx-auto w-full max-w-[1600px] md:px-6 xl:px-8 mt-2 md:mt-6 pb-10">
          <PasswordChangeGate>{mustChangePassword ? null : children}</PasswordChangeGate>
        </div>
      </main>
    </div>
  );
}
