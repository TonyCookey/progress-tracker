"use client";

import { useState } from "react";
import EditGroupForm from "./EditGroupForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function EditGroupModal({
  group,
  label,
  onSuccess,
}: {
  group: any;
  label: string;
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Edit</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Edit ${label}`} size="lg">
        <EditGroupForm
          group={group}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
