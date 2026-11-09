import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const navigation = readFileSync("src/components/Navigation.tsx", "utf8");
const hero = readFileSync("src/components/PremiumHero.tsx", "utf8");
assert.match(hero,/to="\/start"/, "Guided first-trade journey must be discoverable from the homepage");
assert.match(hero,/to="\/trade"/, "Keep direct access to guest virtual trading");
const bottom = readFileSync("src/components/MobileBottomNav.tsx", "utf8");
const routes = readFileSync("src/App.tsx", "utf8");

const header = navigation.match(/const navItems = \[([\s\S]*?)\];/)?.[1] ?? "";
const primary = [...header.matchAll(/to: "([^"]+)", label: "([^"]+)"/g)].map(m => [m[1],m[2]]);
assert.deepEqual(primary, [
  ["/","Home"], ["/learn","Learn"], ["/trade","Trade"],
  ["/portfolio","Portfolio"], ["/newsletter","Newsletter"]
], "Primary navigation follows the beginner learning journey without clutter");

const more = navigation.match(/const moreGroups = \[([\s\S]*?)\];/)?.[1] ?? "";
const sectionLabels = [...more.matchAll(/\{ label: "(Explore|Community|Company|Legal & Trust)", items:/g)].map(m=>m[1]);
assert.deepEqual(sectionLabels,["Explore","Community","Company","Legal & Trust"]);
const secondary = [...more.matchAll(/to: "([^"]+)", label: "([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(secondary, [
  "/start","/practice","/courses","/ai-mentor","/markets","/daily",
  "/leaderboard","/reviews","/about","/contact","/whats-new","/roadmap",
  "/privacy","/terms","/about#disclaimer"
], "All useful secondary pages remain discoverable inside More");

const links = [...primary.map(x=>x[0]),...secondary];
assert.equal(new Set(links).size, links.length, "No duplicated primary/secondary destinations");
for (const path of links) assert.ok(routes.includes('path="'+path.split("#")[0]+'"'), "Missing route: "+path);

assert.match(navigation, /<DropdownMenuTrigger asChild>/);
assert.match(navigation, /<DropdownMenuContent align="end"/);
assert.match(navigation, /max-h-\[calc\(100dvh-7rem\)\]/, "More menu must fit the viewport at 100% zoom");
assert.match(navigation, /overflow-y-auto overscroll-contain/, "Short desktop windows still need access to every menu link");
assert.match(navigation, /rounded-md cursor-pointer text-\[14px\] min-h-9 py-1\.5/, "Compact menu items remain legible and clickable");
assert.match(navigation, /<DropdownMenuLabel className="px-2 py-0\.5/, "Headings use compact but legible padding");
assert.match(navigation, /<DropdownMenuItem key=\{item\.to\} asChild/);
assert.match(navigation, /aria-current=\{isActive\(item\.to\) \? "page" : undefined\}/);
assert.match(navigation, /aria-expanded=\{mobileMoreOpen\} aria-controls="mobile-more-pages"/);
assert.match(navigation, /onClick=\{\(\) => setMobileMoreOpen\(open => !open\)\}/);
assert.match(navigation, /setMobileMenuOpen\(false\)/);
assert.match(navigation, /aria-label="Account menu"/);
assert.match(navigation, /<ThemeToggle/);
assert.match(navigation, /<StreakBadge/);
assert.match(navigation, /const isActive = \(path: string\)/);
assert.match(navigation, /location\.pathname\.startsWith\(path \+ "\/"\)/);
assert.match(bottom, /aria-label="Mobile navigation"/);
for (const path of ["/","/learn","/trade","/portfolio","/markets"])
  assert.ok(bottom.includes('to: "'+path+'"'), "Existing mobile quick destination missing: "+path);
assert.match(readFileSync("src/components/MegaFooter.tsx", "utf8"), /to="\/privacy"/);
assert.match(readFileSync("src/components/MegaFooter.tsx", "utf8"), /to="\/terms"/);
assert.match(readFileSync("src/components/MegaFooter.tsx", "utf8"), /EducationalDisclaimer/);
// Guest journey re-entry must show its progress card, not old scroll position.
assert.match(routes, /const timeouts = \[150, 500, 900\]/,
  "Scroll reset retries after a lazy-loaded route renders");
assert.match(routes, /window\.addEventListener\("wheel", interacted/,
  "Do not override user-initiated wheel scrolling after route navigation");
assert.match(routes, /window\.addEventListener\("touchstart", interacted/,
  "Do not override user-initiated touch scrolling after route navigation");
assert.match(routes, /window\.addEventListener\("keydown", keyboardScroll/,
  "Do not override keyboard scrolling after route navigation");
assert.match(routes, /window\.addEventListener\("scroll", onScroll/,
  "Do not override browser or programmatic scrolling during lazy hydration");
assert.match(routes, /window\.scrollY > 1/,
  "Scroll restoration must detect nonzero scroll position");
const resume = readFileSync("src/components/retention/ContinueBanner.tsx", "utf8");
const notifications = readFileSync("src/components/retention/PushNotificationPrompt.tsx", "utf8");
assert.ok(!resume.includes(" truncate") && !resume.includes("whitespace-nowrap"),
  "Do not truncate the returning visitor message on mobile");
assert.ok(resume.includes("sm:flex-row"), "Mobile resume CTA stacks beneath message");
assert.ok(resume.includes("min-h-11"), "Continue CTA has a touch-sized target");
assert.ok(resume.includes("h-11 w-11"), "Dismiss control has a touch-sized target");
assert.ok(notifications.includes("bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]"),
  "Notification prompt clears the fixed 4rem mobile bar and safe area");
assert.ok(notifications.includes("max-h-[calc(100dvh-9rem)] overflow-y-auto"),
  "Mobile notification prompt must scroll in a short viewport");
assert.ok(notifications.includes("flex flex-wrap items-center gap-2") &&
  notifications.includes("min-h-11") && notifications.includes("h-11 w-11"),
  "Notification prompt decisions and dismiss control remain touch sized on mobile");
const journey = readFileSync("src/pages/BeginnerJourney.tsx", "utf8");
assert.match(journey, /aria-label="Learning journey progress"/,
  "Five-step journey progress card remains present on every render");
console.log("PASS beginner-first nav, grouped More with legal policies, footer legal links, mobile disclosure, account controls");
