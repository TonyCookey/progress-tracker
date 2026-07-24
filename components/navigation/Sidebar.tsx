"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, Fragment } from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
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
  UserPlusIcon,
  HomeModernIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { UploadCloud } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className="h-6 w-6" /> },
  { href: "/dashboard/lieutenants", label: "Lieutenants", icon: <UsersIcon className="h-6 w-6" /> },
  { href: "/dashboard/generals", label: "Generals", icon: <UserCircleIcon className="h-6 w-6" />, role: "SUPERADMIN" },
  { href: "/dashboard/squads", label: "Squads", icon: <UserGroupIcon className="h-6 w-6" /> },
  { href: "/dashboard/platoons", label: "Platoons", icon: <ShieldCheckIcon className="h-6 w-6" /> },
  { href: "/dashboard/households", label: "Households", icon: <HomeModernIcon className="h-6 w-6" /> },
  { href: "/dashboard/activities", label: "Activities", icon: <CalendarDaysIcon className="h-6 w-6" /> },
  { href: "/dashboard/offerings", label: "Offerings", icon: <CurrencyDollarIcon className="h-6 w-6" /> },
  { href: "/dashboard/birthdays", label: "Birthdays", icon: <CakeIcon className="h-6 w-6" /> },
  { href: "/dashboard/new-converts", label: "New Converts", icon: <UserPlusIcon className="h-6 w-6" />, role: ["SUPERADMIN", "GENERAL"] },
  { href: "/dashboard/reports", label: "Monthly Report", icon: <ChartPieIcon className="h-6 w-6" />, role: ["SUPERADMIN", "GENERAL"] },
  // { href: "/dashboard/lieutenants/bulk-upload", label: "Bulk Upload", icon: <UploadCloud className="h-6 w-6" />, role: "SUPERADMIN" },
  { href: "/dashboard/settings", label: "Settings", icon: <Cog6ToothIcon className="h-6 w-6" />, role: "SUPERADMIN" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const userRole = session?.user?.role;

  // Filter links based on role
  const visibleLinks = links.filter((link) => {
    if (!link.role) return true;
    return Array.isArray(link.role) ? link.role.includes(userRole as string) : link.role === userRole;
  });

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 text-lg font-extrabold text-neutral-900">DA Church Tracker</div>
      <div className="border-t border-neutral-200 mx-6 mb-2" />
      <nav className="mt-2 flex-1">
        {visibleLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={clsx(
              "flex items-center space-x-4 px-6 py-3 mx-3 rounded-lg transition-all duration-150 cursor-pointer",
              pathname === href
                ? "bg-accent-50 text-accent-700 border-l-4 border-accent-500 font-semibold"
                : "text-neutral-600 border-l-4 border-transparent hover:bg-neutral-50 hover:text-neutral-900",
            )}
          >
            {icon}
            <span className="text-sm">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Hamburger button for mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-40 bg-white border border-neutral-200 p-2 rounded-lg text-neutral-700 focus:outline-none shadow-soft"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar for desktop */}
      <aside className="hidden md:flex w-64 h-screen bg-white border-r border-neutral-200 fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Sidebar drawer for mobile */}
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={() => setOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            leave="ease-in duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-900/40" />
          </TransitionChild>

          <div className="fixed inset-0 flex">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              leave="ease-in duration-150"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative w-64 max-w-[85vw] h-full bg-white border-r border-neutral-200 shadow-softHover">
                <button
                  className="absolute top-4 right-3 text-neutral-500 hover:text-neutral-900 focus:outline-none min-h-11 min-w-11 flex items-center justify-center"
                  onClick={() => setOpen(false)}
                  aria-label="Close sidebar"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {sidebarContent}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
