import { useEffect } from 'react';

/**
 * Updates document.title to conform with platform specifications: "<Page> · Meridian".
 */
export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    const prev = document.title;
    if (title) {
      document.title = `${title} · Meridian`;
    } else {
      document.title = 'Meridian — Institutional Campus-to-Career OS';
    }
    return () => {
      document.title = prev;
    };
  }, [title]);
};
