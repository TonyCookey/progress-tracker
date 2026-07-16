import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import clsx from "clsx";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, hint, className, id, children, ...props }, ref) => {
  const selectId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          "w-full border rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors bg-white min-h-11 md:min-h-0",
          error ? "border-danger-500" : "border-neutral-300",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-danger-500">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
});
Select.displayName = "Select";

export default Select;

// Shared theming object for react-select instances (e.g. LieutenantTable filters,
// offering type pickers) so they visually match the design system without wrapping
// react-select's own behavior.
export const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#5c9153" : "#d3d0c9",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(92,145,83,0.35)" : "none",
    minHeight: "2.75rem",
    "&:hover": { borderColor: "#5c9153" },
  }),
  option: (base: Record<string, unknown>, state: { isSelected: boolean; isFocused: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? "#5c9153" : state.isFocused ? "#f2f7f0" : "white",
    color: state.isSelected ? "white" : "#211f1b",
  }),
  multiValue: (base: Record<string, unknown>) => ({
    ...base,
    backgroundColor: "#e2ede0",
    borderRadius: "999px",
  }),
};
