"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { HomeIcon, UserGroupIcon, UsersIcon, UserCircleIcon, CalendarIcon, ChartBarIcon, Cog6ToothIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className="h-5 w-5" /> },
  { href: "/dashboard/lieutenants", label: "Lieutenants", icon: <UsersIcon className="h-5 w-5" /> },
  { href: "/dashboard/generals", label: "Generals", icon: <UserCircleIcon className="h-5 w-5" /> },
  { href: "/dashboard/squads", label: "Squads", icon: <UserGroupIcon className="h-5 w-5" /> },
  { href: "/dashboard/platoons", label: "Platoons", icon: <ShieldCheckIcon className="h-5 w-5" /> },
  { href: "/dashboard/activities", label: "Activities", icon: <CalendarIcon className="h-5 w-5" /> },
  { href: "/dashboard/reports", label: "Reports", icon: <ChartBarIcon className="h-5 w-5" /> },
  { href: "/dashboard/settings", label: "Settings", icon: <Cog6ToothIcon className="h-5 w-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white fixed top-0 left-0">
      <div className="px-6 py-4 text-xl font-bold">DA Progress Tracker</div>
      <nav className="mt-4">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx("flex items-center space-x-3 px-4 py-4 hover:bg-gray-700 transition", pathname === href && "bg-gray-700 font-semibold")}
          >
            {icon} <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
