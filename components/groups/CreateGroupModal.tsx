"use client";

import { useState } from "react";
import CreateGroupForm from "./CreateGroupForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function CreateSquadModal({ bases, leaders, type }: { bases: any[]; leaders: any[]; type: string }) {
  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  return (
    <>
      <Button onClick={openModal}>+ Create {type === "PLATOON" ? "Platoon" : "Squad"}</Button>

      <Modal isOpen={isOpen} onClose={closeModal} title={`Create New ${type === "PLATOON" ? "Platoon" : "Squad"}`} size="lg">
        <CreateGroupForm bases={bases} leaders={leaders} type={type} onClose={closeModal} />
      </Modal>
    </>
  );
}
