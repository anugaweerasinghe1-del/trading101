import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Theme-aware source guard, not proof of visual or authenticated E2E behaviour.
for (const path of ["src/pages/AdminDaily.tsx", "src/components/daily/GenerationReadiness.tsx"]) {
  const s = readFileSync(path, "utf8");
  assert.doesNotMatch(s, /border-white\/(?:10|15)/, "White-only borders fail light theme: " + path);
  assert.doesNotMatch(s, /(?<!dark:)text-amber-400/, "Warnings need light-theme contrast: " + path);
  assert.match(s, /border-border/, "Use a theme-aware border: " + path);
  assert.match(s, /text-amber-600 dark:text-amber-400/, "Pair light and dark warning colors: " + path);
}
console.log("ADMIN_DAILY_THEME_CONTRAST_PASS: theme-aware borders and warnings");
