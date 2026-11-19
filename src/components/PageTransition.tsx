import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Routes already remount this component on pathname changes. An immediate,
 * short opacity transition avoids the old blank/delayed-child swap. The first
 * paint is fully visible so every route can report LCP without an opacity ramp,
 * while leaving fixed navbars anchored to the viewport.
 * No transformed ancestor, forced scroll or exit-state timer.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
