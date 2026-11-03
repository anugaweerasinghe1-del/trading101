import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Routes already remount this component on pathname changes. An immediate,
 * short opacity transition avoids the old 200ms blank/delayed-child swap,
 * while leaving fixed navbars anchored to the viewport.
 * No transformed ancestor, forced scroll or exit-state timer.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0.84 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
