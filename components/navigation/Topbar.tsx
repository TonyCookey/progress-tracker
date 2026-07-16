"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import Avatar from "@/components/ui/Avatar";

export default function Topbar() {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "User";
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white border-b border-neutral-200 pl-16 pr-4 md:px-6 flex items-center justify-between z-20 transition-all">
      <div className="flex-1 flex items-center min-w-0 h-full">
        <h1 className="text-sm md:text-base font-semibold text-neutral-900 truncate">David's Army - Raising Giant Killers</h1>
      </div>

      <div className="relative z-10" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center space-x-2 focus:outline-none hover:bg-neutral-100 px-2 py-1 rounded-pill transition min-w-0"
        >
          <Avatar name={userName} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-neutral-700 truncate max-w-[60px] md:max-w-none">{userName}</span>
          <ChevronDownIcon className="w-4 h-4 text-neutral-400" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white border border-neutral-200 rounded-card shadow-softHover z-50 overflow-hidden">
            <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
              Profile
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="block w-full text-left px-4 py-2 text-sm text-danger-500 hover:bg-neutral-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
