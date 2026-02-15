import { useState, useEffect } from 'react';

/**
 * SSR-safe, event-driven media query hook.
 * Uses window.matchMedia for efficient threshold-based re-renders.
 * Only fires when the media query result actually changes.
 * 
 * @param {string} query - CSS media query string, e.g. '(max-width: 768px)'
 * @returns {boolean} Whether the media query currently matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isTablet = useMediaQuery('(max-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    // SSR guard: default to false if window is not available
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);

    // Sync initial state (in case it changed between render and effect)
    setMatches(mediaQueryList.matches);

    // Event-driven: only fires on threshold crossing, not every frame
    const handler = (event) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handler);
    } else {
      // Safari < 14 fallback
      mediaQueryList.addListener(handler);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handler);
      } else {
        mediaQueryList.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
};

export default useMediaQuery;
