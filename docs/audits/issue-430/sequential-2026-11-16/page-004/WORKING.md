# Terms of Service review checkpoint

Page https://www.thetradehq.com/terms
Source revision `4b6906fd81d74589d0565bcf22755c8742f38908`.
Initial evidence captured November 16, 2026. Reviewed by Codex. Production confirmation and rendered desktop/mobile verification remain open.

## First pass

Read the route-owned source for the header, effective date, critical notice, Sections 1–9, four frequently asked questions and their answers, and page metadata. Compared with the publicly indexed non-JavaScript version, then traced its Terms sections to `scripts/staticCopy.ts` and `scripts/staticCopyExtra.ts`.

## Second pass

Compared the same statements across the two versions and separated wording conflicts from questions about how the terms should apply. The simulation, advice and past-performance disclosures agree on the central claims. No ad-click prompts, investment-return guarantees, or implied Google endorsement were identified in the examined Terms copy. The available text does not establish ad placement or account-level compliance.

Relevant Google sections: [Misleading representation, intellectual property and inventory value](https://support.google.com/publisherpolicies/answer/10502938), [AdSense Program policies](https://support.google.com/publisherpolicies/answer/48182), [Publisher Restrictions](https://support.google.com/publisherpolicies/answer/10437795), and [readiness guidance](https://support.google.com/adsense/answer/7299563), reviewed November 16, 2026. No confirmed Google policy conflict was recorded from the wording differences.

## Findings recorded before edits

- **STRICT-TERMS-001** (native-liability). Static summary says TradeHQ accepts no liability for decisions. Section 7 limits the listed damages to the maximum extent permitted by law, and Section 8 preserves mandatory rights. Align the summary with Sections 7 and 8 without editing the operative sections.
- **STRICT-TERMS-002** (native-ownership). Static text makes an unconditional TradeHQ ownership claim about lessons, guides and glossary entries. Section 6 qualifies ownership and explicitly preserves third-party rights and licenses. Use the existing Section 6 qualification in the static summary.
- **STRICT-TERMS-003** (interactive-faq-commercial). The commercial-use FAQ describes scraping and bot use as prohibited without mentioning authorization. Sections 3 and 4 allow authorized automation and permitted scraping. Restore those exceptions in the FAQ.
- **STRICT-TERMS-004** (native-account-eligibility). Static text states a contract-age requirement for accounts. The interactive Terms lack that clause, and Privacy says the optional signup does not ask for age. The absence of an age field does not establish which eligibility policy applies. Owner review of intended eligibility wording; no change to age or permissions.

The page stays open pending full browser coverage, release and production reread. This checkpoint does not change Privacy's status or the completed-page count.
