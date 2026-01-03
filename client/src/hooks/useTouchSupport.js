import { useState, useEffect } from 'react';

/**
 * Custom hook to detect touch support
 * Returns true if device supports touch events
 */
export const useTouchSupport = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check for touch support
    const checkTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouch(checkTouch());
  }, []);

  return isTouch;
};

