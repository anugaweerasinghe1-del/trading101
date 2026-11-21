# Current AdSense policy violation count — evidence ledger

**Verified against current Google policies and source/live TradeHQ evidence on 2026-11-21.**

- **Confirmed currently active Google AdSense/Publisher Policy breaches: 0 evidenced.** This is an evidence count, not certification the entire site or account is compliant.
- **Plausible content-quality/approval-readiness concerns: 1 unresolved discretionary cluster** (ADS26-01, similar short glossary articles). This is **not** a confirmed rule break.
- **Historical high-risk ad implementation finding: 1, fixed** (ADS26-03). There is **no proof that a prohibited Google-served ad impression actually occurred at the time**; it was a historical source implementation risk.
- **Current verified low-impact AdSense technical defect: 0.**
- **Possible UX copy duplication: 1 unverified** (ADS26-12), not an AdSense violation.
- **Unknown gates / untested states: account-side eligibility, browser runtime, future CMP/ad placements, exhaustive content rights and fact-checking.** Unknown is not 'passed' and is not 'failed'.
- **Categories in existing FINDINGS.md: 12**, and updated category matrix in `POLICY-BREACH-MATRIX.csv`: **16 records**. Neither is a count of violations.

The attached matrix has a deliberately explicit column `currently_confirmed_breaks_adsense_rule`. Only **YES** entries could be counted as confirmed current rule breaches; all 16 entries are NO or UNKNOWN. **Zero YES.**

## Explicit policy distinction

The [AdSense Program policies](https://support.google.com/adsense/answer/48182?hl=en) prohibit misleading ad navigation and unsuitable ad placements, but Google must actually serve ads in a disallowed context for those particular inventory clauses to be present as violations. The [Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938?hl=en) prohibit ads on screens without meaningful publisher content and screens carrying replicated content without added value. That is **not** the same as an unconditional ban on brief glossary definitions or a requirement to avoid repeating truthful financial-risk disclaimers. The [site-readiness guidance](https://support.google.com/adsense/answer/7299563?hl=en) separately asks for substantial original visitor value and usable navigation; Google has not given the owner any specific detailed reason for four previous decisions.

## Reaudit evidence

- Refetched 10 strategically varied production endpoints: homepage, About, Terms, Privacy, a brief Wyckoff glossary entry, dynamic beginner course, AI Mentor, noindexed trophies, robots.txt, and ads.txt. **10/10 accessible** with no obvious high-risk profit promise in extracted text. Live /achievements returned noindex; site content in source has ad bootstrap disabled.
- Checked actual Google public program, inventory, site-readiness and verification rules using official Google Help pages, not community guesses.
- Re-examined current `main` code `index.html` and `src/lib/adInventory.ts`: Google AdSense account meta is present; no `adsbygoogle.js` bootstrap; current manual ad inventory denies account/application/empty states by default.
- Fresh interactive browser attempt **did not start** because TinyFish account has insufficient credit. This is an **audit execution limitation, not a TradeHQ website failure**. All prior 163/163 content extraction remains valid, but there is no new browser/mobile network validation.

**Do not modify the production site in response to non-existent confirmed policy breaks.** Reevaluate only after new reproducible evidence, especially before enabling serving. The current final readiness recommendation stays **conditional GO**, not guaranteed approval.
