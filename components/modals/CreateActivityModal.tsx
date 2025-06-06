"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import CreateActivityForm from "../activities/CreateActivityForm";

export default function CreateActivityModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Activity
      </button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded bg-white p-6 shadow transition-all">
                <Dialog.Title className="text-lg font-semibold mb-4">Create Activity</Dialog.Title>

                <CreateActivityForm onSuccess={() => setIsOpen(false)} />
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
