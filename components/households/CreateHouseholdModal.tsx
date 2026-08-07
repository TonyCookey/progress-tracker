"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CreateHouseholdForm from "./CreateHouseholdForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function CreateHouseholdModal({ bases }: { bases: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  function closeModal() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>+ Create Household</Button>

      <Modal isOpen={isOpen} onClose={closeModal} title="Create New Household" size="lg">
        <CreateHouseholdForm bases={bases} onClose={closeModal} />
      </Modal>
    </>
  );
}
