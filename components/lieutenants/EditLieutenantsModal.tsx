"use client";

import { useState } from "react";
import EditLieutenantForm from "./EditLieutenantsForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function EditLieutenantModal({ lieutenant, onSuccess }: { lieutenant: any; onSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Edit
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Lieutenant" size="xl">
        <EditLieutenantForm
          lieutenant={lieutenant}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess?.();
          }}
        />
      </Modal>
    </>
  );
}
