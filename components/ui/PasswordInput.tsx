"use client";

import { forwardRef, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Input, { InputProps } from "./Input";

// Password field with a show/hide eye button. `revealed`/`onRevealedChange` let a form
// drive several fields from one toggle; otherwise each field toggles on its own.
export interface PasswordInputProps extends Omit<InputProps, "type"> {
  revealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ revealed, onRevealedChange, className, ...props }, ref) => {
  const [localRevealed, setLocalRevealed] = useState(false);
  const isRevealed = revealed ?? localRevealed;
  const toggle = () => (onRevealedChange ? onRevealedChange(!isRevealed) : setLocalRevealed(!isRevealed));

  return (
    <Input
      ref={ref}
      type={isRevealed ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      className={className ? `pr-11 ${className}` : "pr-11"}
      trailing={
        <button
          type="button"
          onClick={toggle}
          className="flex h-full w-11 items-center justify-center rounded-r-lg text-neutral-400 hover:text-neutral-700 focus:outline-none focus-visible:text-accent-600"
          aria-label={isRevealed ? "Hide password" : "Show password"}
          aria-pressed={isRevealed}
        >
          {isRevealed ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
