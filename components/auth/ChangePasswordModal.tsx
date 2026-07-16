"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSubmit,
}: Readonly<{ isOpen: boolean; onClose: () => void; onSubmit: (oldPassword: string, newPassword: string) => Promise<void> }>) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await onSubmit(oldPassword, newPassword);
      setSuccess("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="oldPassword"
            label="Current Password"
            type={showOldPassword ? "text" : "password"}
            className="pr-16"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowOldPassword((prev) => !prev)}
            className="absolute right-3 top-9 text-sm text-neutral-500"
            tabIndex={-1}
          >
            {showOldPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="relative">
          <Input
            id="newPassword"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            className="pr-16"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 top-9 text-sm text-neutral-500"
            tabIndex={-1}
          >
            {showNewPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="relative">
          <Input
            id="confirmPassword"
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            className="pr-16"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-9 text-sm text-neutral-500"
            tabIndex={-1}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error && <p className="text-danger-500 text-sm">{error}</p>}
        {success && <p className="text-success-700 text-sm">{success}</p>}
        <Button type="submit" className="w-full" disabled={loading} isLoading={loading}>
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </Modal>
  );
}
