import { useEffect, useRef } from 'react';

/**
 * Invoke the callback when a click/touch happens outside the referenced element.
 */
export function useClickOutside(ref, callback, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handle = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      callbackRef.current(event);
    };

    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [ref, enabled]);
}
