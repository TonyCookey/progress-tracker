"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  UserCircleIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  CakeIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className="h-6 w-6" /> },
  { href: "/dashboard/lieutenants", label: "Lieutenants", icon: <UsersIcon className="h-6 w-6" /> },
  { href: "/dashboard/generals", label: "Generals", icon: <UserCircleIcon className="h-6 w-6" />, role: "SUPERADMIN" },
  { href: "/dashboard/squads", label: "Squads", icon: <UserGroupIcon className="h-6 w-6" /> },
  { href: "/dashboard/platoons", label: "Platoons", icon: <ShieldCheckIcon className="h-6 w-6" /> },
  { href: "/dashboard/activities", label: "Activities", icon: <CalendarDaysIcon className="h-6 w-6" /> },
  { href: "/dashboard/offerings", label: "Offerings", icon: <CurrencyDollarIcon className="h-6 w-6" /> },
  { href: "/dashboard/birthdays", label: "Birthdays", icon: <CakeIcon className="h-6 w-6" /> },
  { href: "/dashboard/reports", label: "Reports", icon: <ChartPieIcon className="h-6 w-6" />, role: "SUPERADMIN" },
  { href: "/dashboard/settings", label: "Settings", icon: <Cog6ToothIcon className="h-6 w-6" />, role: "SUPERADMIN" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role;

  // Filter links based on role
  const visibleLinks = links.filter((link) => {
    if (!link.role) return true;
    return link.role === userRole;
  });

  return (
    <aside className="w-64 h-screen bg-gradient-to-b from-cyan-900 via-cyan-800 to-cyan-700 text-white fixed top-0 left-0 shadow-lg">
      <div className="px-6 py-6 text-xl font-extrabold text-400">DA Church Tracker</div>
      <div className="border-t border-cyan-700 mx-6 mb-2" />
      <nav className="mt-2">
        {visibleLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center space-x-4 px-6 py-3 rounded-lg transition-all duration-150 cursor-pointer ",
              "hover:bg-cyan-600 hover:text-white",
              pathname === href ? "bg-cyan-700 text-white border-l-4 border-cyan-400 font-semibold shadow" : "text-cyan-200"
            )}
          >
            {icon}
            <span className="text-base">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
