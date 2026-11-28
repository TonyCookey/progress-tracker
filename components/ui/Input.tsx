import { InputHTMLAttributes, ReactNode, forwardRef } from "react";
import clsx from "clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  pill?: boolean;
  /** Element pinned inside the right edge of the field (e.g. a show-password button). */
  trailing?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, pill, trailing, className, id, ...props }, ref) => {
  const inputId = id ?? props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "w-full border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 transition-colors min-h-11 md:min-h-0",
          pill ? "rounded-pill" : "rounded-lg",
          error ? "border-danger-500" : "border-neutral-300",
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {trailing && <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger-500">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";

export default Input;
