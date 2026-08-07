"use client";

import ChangePasswordModal from "@/components/auth/ChangePasswordModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { uploadPersonImage } from "@/lib/uploadImage";
import CreateImageField from "@/components/input/CreateImageField";
import PersonAvatar from "@/components/ui/PersonAvatar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { data: session } = useSession();
  const toast = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const user = session?.user;

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/generals/${user.id}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setImageKey(data?.imageKey ?? null))
      .catch((err) => console.error("Failed to fetch profile image", err));
  }, [user?.id]);

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

  const handleFileChange = async (file: File | null) => {
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      await uploadPersonImage(file, "general", user.id);
      toast.success("Photo updated successfully");
      const res = await fetch(`/api/generals/${user.id}`, { cache: "no-store" });
      const data = await res.json();
      setImageKey(data?.imageKey ?? null);
    } catch (err) {
      console.error("Failed to upload photo", err);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-8 text-neutral-900">My Profile</h2>

      {user ? (
        <div>
          <Card className="flex flex-col items-center space-y-6">
            {/* Avatar */}
            <PersonAvatar imageKey={imageKey} alt={`${user.name}'s profile`} size={112} />
            <CreateImageField onFileChange={handleFileChange} />
            {uploading && <p className="text-xs text-neutral-500">Uploading…</p>}
            {/* Info */}
            <div className="w-full space-y-4">
              <div>
                <span className="block text-neutral-500 text-xs mb-1">Name</span>
                <p className="text-base font-semibold text-neutral-800">{user.name}</p>
              </div>
              <div>
                <span className="block text-neutral-500 text-xs mb-1">Email</span>
                <p className="text-base font-semibold text-neutral-800">{user.email}</p>
              </div>
              <div>
                <span className="block text-neutral-500 text-xs mb-1">Role</span>
                <Badge tone="accent">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "N/A"}</Badge>
              </div>
            </div>
          </Card>
          <div className="flex mt-8 justify-end">
            <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
              Change Password
            </Button>
            <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} onSubmit={handlePasswordUpdate} />
          </div>
        </div>
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
}
