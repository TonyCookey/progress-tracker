"use client";

import { useState } from "react";
import EditHouseholdForm from "./EditHouseholdForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function EditHouseholdModal({ household, onSuccess }: { household: any; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Edit</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Household" size="lg">
        <EditHouseholdForm
          household={household}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
