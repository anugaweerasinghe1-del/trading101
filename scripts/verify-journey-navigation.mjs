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
const sectionLabels = [...more.matchAll(/\{ label: "(Explore|Community|Company)", items:/g)].map(m=>m[1]);
assert.deepEqual(sectionLabels,["Explore","Community","Company"]);
const secondary = [...more.matchAll(/to: "([^"]+)", label: "([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(secondary, [
  "/courses","/ai-mentor","/markets","/daily",
  "/leaderboard","/reviews","/about","/contact"
], "All useful secondary pages remain discoverable inside More");

const links = [...primary.map(x=>x[0]),...secondary];
assert.equal(new Set(links).size, links.length, "No duplicated primary/secondary destinations");
for (const path of links) assert.ok(routes.includes('path="'+path+'"'), "Missing route: "+path);

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
console.log("PASS beginner-first nav, dropdown groups, routes, mobile More, active states, account/theme, existing bottom nav");
