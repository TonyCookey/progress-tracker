"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import EditGroupForm from "./EditGroupForm";

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
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow">
        Edit
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
              <DialogPanel className="w-full max-w-lg transform rounded bg-white p-6 shadow-xl transition-all">
                <DialogTitle className="text-lg font-medium text-gray-900">Edit {label}</DialogTitle>
                <EditGroupForm
                  group={group}
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
