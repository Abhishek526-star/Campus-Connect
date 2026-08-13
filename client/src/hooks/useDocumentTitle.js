import { useEffect } from 'react';

/** Set the document title; restores on unmount. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · Campus Connect` : 'Campus Connect';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
