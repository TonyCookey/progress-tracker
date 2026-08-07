"use client";

import { useState } from "react";
import CreateLieutenantForm from "./CreateLieutenantsForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function CreateLieutenantModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Add Lieutenant
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Lieutenant" size="xl">
        <CreateLieutenantForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  );
}
