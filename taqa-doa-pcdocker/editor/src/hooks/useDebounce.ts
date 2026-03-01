import { useState, useEffect } from 'react';

/**
 * Debounce a value by the given delay (in ms).
 * Returns the debounced value which only updates after the caller
 * stops changing the input for `delay` milliseconds.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
