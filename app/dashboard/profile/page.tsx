"use client";

import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const user = session?.user;

  const handlePasswordUpdate = async (oldPassword: string, newPassword: string) => {
    const res = await fetch(`/api/generals/${user?.id}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Failed to update password");
    }
    // Log out after password change
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-3xl font-bold mb-8 text-700">My Profile</h2>

      {user ? (
        <div>
          <div className="bg-white shadow-lg rounded-xl p-8 flex flex-col items-center space-y-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-4xl shadow">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            {/* Info */}
            <div className="w-full space-y-4">
              <div>
                <span className="block text-gray-500 text-xs mb-1">Name</span>
                <p className="text-lg font-semibold text-gray-800">{user.name}</p>
              </div>
              <div>
                <span className="block text-gray-500 text-xs mb-1">Email</span>
                <p className="text-lg font-semibold text-gray-800">{user.email}</p>
              </div>
              <div>
                <span className="block text-gray-500 text-xs mb-1">Role</span>
                <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex mt-8 justify-end">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold shadow"
            >
              Change Password
            </button>
            <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSubmit={handlePasswordUpdate} />
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
}
