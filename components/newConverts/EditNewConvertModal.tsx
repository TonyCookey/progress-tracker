"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import EditNewConvertForm from "./EditNewConvertForm";

export default function EditNewConvertModal({ newConvert, onSuccess }: { newConvert: any; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} title="Edit" className="p-2 rounded hover:bg-blue-100 transition">
        <PencilIcon className="w-5 h-5 text-blue-600" />
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
                <DialogTitle className="text-lg font-medium text-gray-900">Edit New Convert</DialogTitle>
                <EditNewConvertForm
                  newConvert={newConvert}
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
