import { useState, useEffect } from "react";

/** Debounce a value - used for search inputs across feature hooks. */
export function useDebouncedValue(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

export default useDebouncedValue;
