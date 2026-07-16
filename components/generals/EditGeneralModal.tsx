"use client";

import { useState } from "react";
import EditGeneralForm from "./EditGeneralForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function EditGeneralModal({ general, onSuccess }: { general: any; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Edit
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit General" size="lg">
        <EditGeneralForm
          general={general}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
