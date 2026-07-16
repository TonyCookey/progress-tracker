"use client";

import { useState } from "react";
import CreateNewConvertForm from "./CreateNewConvertForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function CreateNewConvertModal({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        + Add New Convert
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add New Convert" size="xl">
        <CreateNewConvertForm
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
