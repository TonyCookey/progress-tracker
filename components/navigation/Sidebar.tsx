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
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className="h-5 w-5" /> },
  { href: "/dashboard/lieutenants", label: "Lieutenants", icon: <UsersIcon className="h-5 w-5" /> },
  { href: "/dashboard/generals", label: "Generals", icon: <UserCircleIcon className="h-5 w-5" />, role: "SUPERADMIN" },
  { href: "/dashboard/squads", label: "Squads", icon: <UserGroupIcon className="h-5 w-5" /> },
  { href: "/dashboard/platoons", label: "Platoons", icon: <ShieldCheckIcon className="h-5 w-5" /> },
  { href: "/dashboard/activities", label: "Activities", icon: <CalendarDaysIcon className="h-5 w-5" /> },
  { href: "/dashboard/offerings", label: "Offerings", icon: <CurrencyDollarIcon className="h-5 w-5" /> },
  { href: "/dashboard/birthdays", label: "Birthdays", icon: <CakeIcon className="h-5 w-5" /> },
  { href: "/dashboard/reports", label: "Reports", icon: <ChartPieIcon className="h-5 w-5" />, role: "SUPERADMIN" },
  { href: "/dashboard/settings", label: "Settings", icon: <Cog6ToothIcon className="h-5 w-5" />, role: "SUPERADMIN" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role;

  // Filter links based on role
  const visibleLinks = links.filter((link) => {
    if (!link.role) return true; // visible to all
    return link.role === userRole; // visible to matching role only
  });

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white fixed top-0 left-0">
      <div className="px-6 py-4 text-lg font-bold">DA Progress Tracker</div>
      <nav className="mt-4">
        {visibleLinks.map(({ href, label, icon }) => (
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
