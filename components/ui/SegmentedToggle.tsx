import clsx from "clsx";

export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    // Scrolls sideways instead of wrapping labels when there isn't room (phones).
    <div
      className={clsx("inline-flex max-w-full items-center overflow-x-auto rounded-pill bg-neutral-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      role="tablist"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={clsx(
            "shrink-0 whitespace-nowrap px-3.5 py-1.5 text-sm font-medium rounded-pill transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400",
            option.value === value ? "bg-white text-accent-700 shadow-soft" : "text-neutral-500 hover:text-neutral-700",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
