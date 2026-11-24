"use client";

import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import FirstTimerForm, { FirstTimer } from "./FirstTimerForm";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export function CreateFirstTimerModal({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        + Add First Timer
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add First Timer" size="xl">
        <FirstTimerForm
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}

export function EditFirstTimerModal({ firstTimer, onSuccess }: { firstTimer: FirstTimer; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)} title="Edit" className="p-2 rounded-pill hover:bg-accent-50 transition">
        <PencilIcon className="w-5 h-5 text-accent-600" />
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit First Timer" size="xl">
        <FirstTimerForm
          firstTimer={firstTimer}
          onSuccess={() => {
            setIsOpen(false);
            onSuccess();
          }}
        />
      </Modal>
    </>
  );
}
