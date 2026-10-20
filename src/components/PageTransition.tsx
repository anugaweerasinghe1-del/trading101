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
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? "opacity-100 transform-none filter-none"
          : "opacity-0 translate-y-4 scale-[0.98] blur-[2px]"
      }`}
    >
      {displayChildren}
    </div>
  );
}
