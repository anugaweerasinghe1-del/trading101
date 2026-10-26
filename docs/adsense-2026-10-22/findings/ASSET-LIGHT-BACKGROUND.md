# THQ-046 — asset terminal light-theme surface

Current production 99d98d1 reproduces dark text on the hardcoded near-black TradeAsset wrapper. Actual foreground rgb(15,15,15) against rgb(5,5,5) yields1.06:1 contrast. All eight before images were personally inspected: USD/JPY and BTC at360/1280 in light/dark. Heading, breadcrumb, takeaway heading and chart price disappear in light theme. This is a P2 readability issue; other terminal pages share this wrapper but have not all received individual visual review.

Fix: replace only `bg-[hsl(0_0%_2%)]` with existing theme token `bg-background` in `src/pages/TradeAsset.tsx`. Interface-only, one class, reversible by ordinary reviewed revert. Preserve all trade callbacks, calculations, orders, fees, quote/chart behavior, accounts, records, progress, privacy/consent, ads and infrastructure. No record or order test is authorized or needed for this color fix.

Full build and TypeScript pass on candidate9229cbab0fb72cea0cc11f37f4d8216b5a930e07. Local rendered checks and the complete candidate/preview/merge/native-production/live cycle remain; authoritative current state is FINDINGS.json and RELEASE-LEDGER.json. Earlier forex-unit investigation remains separate and unresolved; no accounting change is part of this fix.
