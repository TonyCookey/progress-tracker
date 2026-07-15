"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import CreateHouseholdForm from "./CreateHouseholdForm";

export default function CreateHouseholdModal({ bases }: { bases: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  function closeModal() {
    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700">
        + Create Household
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            leave="ease-in duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                leave="ease-in duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded bg-white p-6 shadow-xl transition-all">
                  <DialogTitle className="text-lg font-medium text-gray-900 mb-4">Create New Household</DialogTitle>
                  <CreateHouseholdForm bases={bases} onClose={closeModal} />
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
