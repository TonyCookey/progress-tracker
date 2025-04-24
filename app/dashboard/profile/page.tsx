"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-4">My Profile</h2>

      {user ? (
        <div className="bg-white shadow rounded p-6 space-y-4">
          <div>
            <span className="block text-gray-600 text-sm">Name</span>
            <p className="text-lg">{user.name}</p>
          </div>
          <div>
            <span className="block text-gray-600 text-sm">Email</span>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <span className="block text-gray-600 text-sm">Role</span>
            <p className="text-lg capitalize">{user.role || "N/A"}</p>
          </div>
          {/* Optional: Add other things... */}
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
