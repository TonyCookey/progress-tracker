"use client";

import { Menu, MenuButton, MenuItem, MenuItems, MenuSeparator } from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { ComponentType, SVGProps } from "react";

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  description?: string;
  tone?: "default" | "danger" | "warning";
  disabled?: boolean;
  hidden?: boolean;
  /** Draw a divider above this item. */
  separated?: boolean;
}

const toneClasses = {
  default: "text-neutral-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
};

// Compact "⋯" overflow menu for row/page actions, so tables don't wrap a pile of
// buttons on laptop widths. Anchored with headlessui so it never clips off-screen.
export default function ActionMenu({ items, label = "More actions", disabled, className }: { items: ActionMenuItem[]; label?: string; disabled?: boolean; className?: string }) {
  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <Menu as="div" className={clsx("relative inline-block text-left", className)}>
      <MenuButton
        disabled={disabled}
        aria-label={label}
        className="inline-flex min-h-11 min-w-11 md:min-h-9 md:min-w-9 items-center justify-center rounded-pill border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50 data-[open]:bg-neutral-100"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </MenuButton>
      <MenuItems
        anchor={{ to: "bottom end", gap: 6, padding: 12 }}
        transition
        className="z-50 w-60 origin-top-right rounded-xl border border-neutral-200 bg-white p-1 shadow-softHover focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
      >
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}>
              {item.separated && <MenuSeparator className="my-1 h-px bg-neutral-100" />}
              <MenuItem disabled={item.disabled}>
                <button
                  type="button"
                  onClick={item.onClick}
                  className={clsx(
                    "group flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm data-[focus]:bg-neutral-50 data-[disabled]:opacity-50",
                    toneClasses[item.tone ?? "default"],
                  )}
                >
                  {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />}
                  <span className="min-w-0">
                    <span className="block font-medium">{item.label}</span>
                    {item.description && <span className="block text-xs text-neutral-500">{item.description}</span>}
                  </span>
                </button>
              </MenuItem>
            </div>
          );
        })}
      </MenuItems>
    </Menu>
  );
}
