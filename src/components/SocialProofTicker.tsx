import { motion } from "framer-motion";

const items = [
  "170 assets available",
  "100% free",
  "No signup required",
  "Market-style simulation",
  "$100K virtual cash",
  "Educational mentor included",
  "Stocks, ETFs & crypto",
  "Built for beginners",
];

export function SocialProofTicker() {
  const loopItems = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-white/[0.08] bg-white/[0.02] py-3">
      <motion.div
        className="flex w-max items-center gap-3"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 120, ease: "linear", repeat: Infinity }}
      >
        {loopItems.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-foreground/90"
          >
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
