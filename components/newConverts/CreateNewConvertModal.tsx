"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import CreateNewConvertForm from "./CreateNewConvertForm";

export default function CreateNewConvertModal({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 w-full sm:w-auto">
        + Add New Convert
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsOpen}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <DialogPanel className="w-full max-w-2xl transform rounded bg-white p-6 shadow-xl transition-all">
                <DialogTitle className="text-lg font-medium text-gray-900">Add New Convert</DialogTitle>
                <CreateNewConvertForm
                  onSuccess={() => {
                    setIsOpen(false);
                    onSuccess();
                  }}
                />
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
