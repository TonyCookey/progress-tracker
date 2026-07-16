"use client";

import { useState } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import ConvertToTeenForm from "./ConvertToTeenForm";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "@/components/ui/Modal";

export default function ConvertToTeenModal({ newConvertId, onSuccess }: { newConvertId: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newConvert, setNewConvert] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/new-converts/${newConvertId}`, { cache: "no-store" });
      if (res.ok) {
        setNewConvert(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={open} title="Convert to Teen" className="p-2 rounded hover:bg-success-50 transition">
        <UserPlusIcon className="w-5 h-5 text-success-700" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Convert to Teen" size="xl">
        {loading || !newConvert ? (
          <LoadingSpinner />
        ) : (
          <ConvertToTeenForm
            newConvert={newConvert}
            onSuccess={() => {
              setIsOpen(false);
              onSuccess();
            }}
          />
        )}
      </Modal>
    </>
  );
}
