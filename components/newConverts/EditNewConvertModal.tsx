"use client";

import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import EditNewConvertForm from "./EditNewConvertForm";
import Modal from "@/components/ui/Modal";

export default function EditNewConvertModal({ newConvert, onSuccess }: { newConvert: any; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} title="Edit" className="p-2 rounded hover:bg-accent-50 transition">
        <PencilIcon className="w-5 h-5 text-accent-600" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit New Convert" size="xl">
        <EditNewConvertForm
          newConvert={newConvert}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
