"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/squads", label: "Squads" },
  { href: "/dashboard/platoons", label: "Platoons" },
  { href: "/dashboard/lieutenants", label: "Lieutenants" },
  { href: "/dashboard/generals", label: "Generals" },
  { href: "/dashboard/activities", label: "Activities" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white fixed top-0 left-0">
      <div className="px-6 py-4 text-xl font-bold">DA Progress Tracker</div>
      <nav className="mt-4">
        {links.map(({ href, label }) => (
          <Link key={href} href={href} className={clsx("block px-6 py-3 hover:bg-gray-700 transition", pathname === href && "bg-gray-700 font-semibold")}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
