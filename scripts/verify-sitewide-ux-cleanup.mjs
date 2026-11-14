import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path, "utf8");
const nav=read("src/components/Navigation.tsx");
const pageTransition=read("src/components/PageTransition.tsx");
const markets=read("src/pages/Markets.tsx");
const clusters=read("src/components/MarketClusters.tsx");
const footer=read("src/components/MegaFooter.tsx");
const home=read("src/pages/Index.tsx");
const weekly=read("src/pages/NewsletterPage.tsx");
const calculator=read("src/components/CompoundCalculator.tsx");
const roadmap=read("src/pages/Roadmap.tsx");
const routes=read("src/App.tsx");

assert.match(markets, /<Navigation\s*\/>/);
assert.doesNotMatch(markets, /<TradingSidebar|trading\/TradingSidebar/);
assert.match(markets, /pt-24 px-4 pb-8 md:pt-28/);
assert.match(nav, /text-\[15px\] 2xl:text-base/);
assert.match(pageTransition, /useReducedMotion/);
assert.match(pageTransition, /motion\.div/);
assert.match(pageTransition, /duration: reduced \? 0 : 0\.2/);
assert.doesNotMatch(pageTransition, /scale-\[0\.98\]|translate-y-4|blur-\[2px\]/);
assert.match(nav, /label: "Roadmap"/);
assert.match(footer, /to: "\/roadmap", label: "Roadmap"/);
assert.match(routes, /path="\/roadmap"/);

assert.match(home, /<NewsletterSignup prominent\s*\/>/);
assert.match(weekly, /<NewsletterSignup prominent\s*\/>/);
assert.match(footer, /pathname === "\/" \|\| pathname\.startsWith\("\/newsletter"\)/);
assert.match(footer, /hasPrimaryNewsletterSignup \? \(/);
assert.match(footer, /Contact TradeHQ/);
assert.match(footer, /mailto:anugaweerasinghe1@gmail\.com/);
assert.match(footer, /<NewsletterSignup\s*\/>/);
assert.match(footer, /to="\/privacy"/);
assert.match(footer, /to="\/terms"/);
const socialProfiles = [
  "https://www.instagram.com/thetradehq_1/",
  "https://www.instagram.com/anw_008/",
  "https://bsky.app/profile/anugaweerasinghe.bsky.social",
];
for (const url of socialProfiles) {
  assert.ok(footer.includes(`href="${url}"`), `Footer social link missing: ${url}`);
  assert.ok(home.includes(`href="${url}"`), `Homepage social link missing: ${url}`);
}
assert.match(footer, /tel:\+94714897346/);
assert.match(footer, /Founder · personal accounts/);
assert.match(home, /Founder · personal:/);
assert.match(home, /aria-labelledby="follow-tradehq-heading"/);
assert.equal((home.match(/id="follow-tradehq-heading"/g) || []).length, 1, "Only one homepage follow section");
const followSectionPosition = home.indexOf('aria-labelledby="follow-tradehq-heading"');
assert.ok(
  followSectionPosition > home.indexOf("<PremiumFeatures />") &&
  followSectionPosition < home.indexOf("<TopAssetsGrid />"),
  "Homepage follow invitation belongs after core product features and before long exploration links"
);
assert.ok(
  home.indexOf('aria-label="Guided beginner journey"') < followSectionPosition &&
  home.indexOf('aria-label="Daily engagement"') < followSectionPosition,
  "Beginner journey and Daily Practice must remain ahead of social promotion"
);
assert.doesNotMatch(read("index.html"), /<meta\s+name="twitter:creator"\s+content="@tradehq"/, "Do not assert an unverified X account");


assert.match(calculator, /window\.location\.hash !== "#compound-initial-capital"/);
assert.match(calculator, /requestAnimationFrame/);
assert.match(calculator, /target\.scrollIntoView/);
assert.match(calculator, /target\.focus/);
assert.match(calculator, /addEventListener\("hashchange"/);
assert.match(calculator, /Math\.min\(100000000/);
assert.match(calculator, /Math\.min\(1000000/);
assert.match(calculator, /Math\.max\(result\.finalValue, 1\)/);
assert.match(calculator, /useState\(1000\)/);
assert.match(clusters, /a\.changePercent/);
assert.doesNotMatch(clusters, /sum \+ \(a\.change \|\| 0\)/);

assert.match(roadmap, /TradeHQ Newsletter/);
assert.match(roadmap, /One Beginner Journey/);
assert.match(roadmap, /21 Nov 2026/);
assert.match(roadmap, /Learn\. Practise\. Grow\./);
assert.doesNotMatch(roadmap, /adsense/i);
assert.match(roadmap, /status: "in-progress"/);
assert.match(roadmap, /status: "shipped"/);
console.log("PASS consistent desktop/mobile navigation, single newsletter form per route, contact footer, calculator deep link, market percent units and public November roadmap");
