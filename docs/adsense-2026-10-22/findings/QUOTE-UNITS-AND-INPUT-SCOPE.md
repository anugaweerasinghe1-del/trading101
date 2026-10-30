# Quote units and input scope

THQ072/073 reproduced report F01/F03 in actual USDJPY main text and personally viewed screenshots. PR264 now displays quote-currency units and explains the existing simplified USD virtual execution model separately. Nine frontend files change presentation only; values, rounding, source selection, fees, amounts, orders, accounting and records are preserved. Rollback is an ordinary revert PR.

Candidate `62aac4f4d49c0a2883436786774efee92e1fadaa` passed full build, numeric/AST preservation, four trusted required CI checks and native Cloudflare/Vercel previews. Actual Cloudflare preview passed60 source states and30 visible-pointer drawer states;110 accepted captures personally viewed. Preview guest gate passed30 states/four safe controls.

Merged as `ad86b30c6877cafe9ffcc47aa3dd8c117e38bef9`. All six exact-main checks and authenticated native production checks passed: Cloudflare `84b217b2-ab24-46a7-a195-2d8f0350b1b6`, Vercel `dpl_G5fdpoeQ5hWeb2U9SetsWSYx3AQD`. Production affected review passed90 states with110 accepted captures personally viewed in20 sheets; guest regression passed30 states/four safe controls, no runtime errors. See PR264 production CI/provider/browser/personal receipts.

Initial off-screen programmatic drawer captures remain excluded. Truthful audit-client identification resolved the former Cloudflare1010 access failure. This correction does not convert the simplified FX ledger into a real FX contract model or establish whole-page/source/accessibility completion.
