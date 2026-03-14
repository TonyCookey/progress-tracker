"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

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
    <div className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white shadow px-4 md:px-6 flex items-center justify-between z-20 transition-all">
      {/* Centered title for mobile, normal for desktop */}
      <div className="flex-1 flex items-center justify-center md:justify-start relative h-full">
        <h1 className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 text-base md:text-lg font-semibold text-cyan-900 truncate max-w-[70vw] md:max-w-none text-center">
          DA Church Tracker
        </h1>
      </div>

      <div className="relative z-10" ref={dropdownRef}>
        <button onClick={() => setOpen(!open)} className="flex items-center space-x-2 focus:outline-none hover:bg-blue-50 px-2 py-1 rounded transition min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-blue-700 font-bold text-sm border-2 border-cyan-400">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden xs:inline text-sm font-medium text-gray-700 truncate max-w-[60px] md:max-w-none">{userName}</span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
            <a href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Profile
            </a>
            <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
