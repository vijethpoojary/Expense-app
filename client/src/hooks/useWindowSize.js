import { useState, useEffect } from 'react';

/**
 * Custom hook to detect window size
 * Returns width and height of the window
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Custom hook to detect if device is mobile
 * Returns true if width <= 768px
 */
export const useIsMobile = () => {
  const { width } = useWindowSize();
  return width <= 768;
};

/**
 * Custom hook to detect if device is tablet
 * Returns true if width > 768px and <= 1024px
 */
export const useIsTablet = () => {
  const { width } = useWindowSize();
  return width > 768 && width <= 1024;
};

/**
 * Custom hook to detect if device is desktop
 * Returns true if width > 1024px
 */
export const useIsDesktop = () => {
  const { width } = useWindowSize();
  return width > 1024;
};

