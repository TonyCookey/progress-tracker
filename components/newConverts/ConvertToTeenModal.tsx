"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, useState } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import ConvertToTeenForm from "./ConvertToTeenForm";
import LoadingSpinner from "../common/LoadingSpinner";

export default function ConvertToTeenModal({ newConvertId, onSuccess }: { newConvertId: string; onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newConvert, setNewConvert] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/new-converts/${newConvertId}`, { cache: "no-store" });
      if (res.ok) {
        setNewConvert(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={open} title="Convert to Teen" className="p-2 rounded hover:bg-green-100 transition">
        <UserPlusIcon className="w-5 h-5 text-green-600" />
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
                <DialogTitle className="text-lg font-medium text-gray-900">Convert to Teen</DialogTitle>
                {loading || !newConvert ? (
                  <LoadingSpinner />
                ) : (
                  <ConvertToTeenForm
                    newConvert={newConvert}
                    onSuccess={() => {
                      setIsOpen(false);
                      onSuccess();
                    }}
                  />
                )}
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
