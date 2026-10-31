import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const navigation = readFileSync("src/components/Navigation.tsx", "utf8");
const bottom = readFileSync("src/components/MobileBottomNav.tsx", "utf8");
const routes = readFileSync("src/App.tsx", "utf8");

const header = navigation.match(/const navItems = \[([\s\S]*?)\];/)?.[1] ?? "";
const primary = [...header.matchAll(/to: "([^"]+)", label: "([^"]+)"/g)].map(m => [m[1],m[2]]);
assert.deepEqual(primary, [
  ["/","Home"], ["/learn","Learn"], ["/trade","Trade"],
  ["/portfolio","Portfolio"], ["/newsletter","Weekly"]
], "Primary navigation follows the beginner learning journey without clutter");

const more = navigation.match(/const moreGroups = \[([\s\S]*?)\];/)?.[1] ?? "";
const sectionLabels = [...more.matchAll(/\{ label: "(Explore|Community|Company|Legal & Trust)", items:/g)].map(m=>m[1]);
assert.deepEqual(sectionLabels,["Explore","Community","Company","Legal & Trust"]);
const secondary = [...more.matchAll(/to: "([^"]+)", label: "([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(secondary, [
  "/start","/courses","/ai-mentor","/markets","/daily",
  "/leaderboard","/reviews","/about","/contact","/roadmap",
  "/privacy","/terms","/about#disclaimer"
], "All useful secondary pages remain discoverable inside More");

const links = [...primary.map(x=>x[0]),...secondary];
assert.equal(new Set(links).size, links.length, "No duplicated primary/secondary destinations");
for (const path of links) assert.ok(routes.includes('path="'+path.split("#")[0]+'"'), "Missing route: "+path);

assert.match(navigation, /<DropdownMenuTrigger asChild>/);
assert.match(navigation, /<DropdownMenuContent align="end"/);
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
console.log("PASS beginner-first nav, grouped More with legal policies, footer legal links, mobile disclosure, account controls");
