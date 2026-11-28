"use client";

import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import { Fragment, ReactNode } from "react";
import clsx from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-3xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  size = "lg",
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      {/* z-50: must sit above the fixed top bar (z-20) and sidebar (z-30), or headers get covered on short screens. */}
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          leave="ease-in duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-neutral-900/25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              leave="ease-in duration-200"
              enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={clsx(
                  // Phones: bottom sheet. Larger: centred card. Either way the header stays put
                  // and only the body scrolls, so the title/close button are never off-screen.
                  "flex w-full transform flex-col overflow-hidden rounded-t-card bg-white shadow-softHover transition-all sm:rounded-card",
                  "max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)]",
                  sizeClasses[size],
                )}
              >
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-100 px-5 py-4 sm:px-6">
                  <DialogTitle className="text-base font-semibold text-neutral-900">{title}</DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-2 flex h-9 w-9 items-center justify-center rounded-pill text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
