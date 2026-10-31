import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start exit animation
    setIsVisible(false);

    // After exit animation, swap children and start enter animation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  // Initial mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      // A transformed ancestor becomes the containing block for CSS fixed
      // descendants, causing the shared navbar to shrink/shift on mobile.
      // Fade route content without scale/translate/filter so fixed headers
      // remain viewport-anchored on every route during navigation.
      className={`transition-opacity duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {displayChildren}
    </div>
  );
}
