import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether a form value differs from its baseline.
 * Use to drive a StickyActionBar or unsaved-changes indicator.
 *
 *   const { dirty, reset } = useDirtyForm(form);
 *   <StickyActionBar visible={dirty} onSave={...} onCancel={reset} />
 */
export function useDirtyForm<T>(value: T) {
  const baseline = useRef<string>(JSON.stringify(value));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(JSON.stringify(value) !== baseline.current);
  }, [value]);

  return {
    dirty,
    reset: () => {
      baseline.current = JSON.stringify(value);
      setDirty(false);
    },
    rebase: (next: T) => {
      baseline.current = JSON.stringify(next);
      setDirty(false);
    },
  };
}
