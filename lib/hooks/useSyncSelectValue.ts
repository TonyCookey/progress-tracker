import { useEffect } from "react";
import type { FieldValues, Path, PathValue, UseFormSetValue } from "react-hook-form";

/**
 * A <select>'s <option> list is often populated from an API call after mount.
 * Calling `setValue`/setting `defaultValues` before that fetch resolves silently
 * fails - the browser can't select a value with no matching <option> in the DOM
 * yet, and React doesn't retroactively fix it once the options arrive. Re-apply
 * the value once `options` actually has entries.
 */
export function useSyncSelectValue<TFieldValues extends FieldValues, TFieldName extends Path<TFieldValues>>(
  options: unknown[],
  setValue: UseFormSetValue<TFieldValues>,
  field: TFieldName,
  value: PathValue<TFieldValues, TFieldName>,
) {
  useEffect(() => {
    if (options.length) setValue(field, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
}
