"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import CreateActivityForm from "../activities/CreateActivityForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreateActivityModal({ isOpen, onClose }: Props) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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

              <CreateActivityForm onSuccess={onClose} />
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
