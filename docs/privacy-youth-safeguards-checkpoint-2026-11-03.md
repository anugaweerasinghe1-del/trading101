# Privacy & youth safeguards — implementation checkpoint

**Date:** 3 November 2026  
**Scope:** The website's optional Amplitude analytics, Practice Arena research questionnaire, related public disclosures and ambiguous arbitration wording.  
**Status:** Concrete privacy mitigations implemented in source; this is **NOT** a declaration of legal compliance or an independent legal opinion.

## Changes to the implemented site

1. The previous `tradehq_consent_v1` choice does **not** migrate. A fresh explicit choice is required under `tradehq_consent_v2`.
2. The **Reject** path works without an age declaration. The **Accept** path requires an adult (18+) self-confirmation. This does not verify a person's actual age; minors are instructed to reject and can continue using all simulator features.
3. Amplitude session replay is **removed**, as is the engagement plugin. `autocapture:false` disables automatic page views, attribution, form and button interactions and network events. `fetchRemoteConfig:false` prevents the project from remotely enabling these captures through the website SDK's automatic configuration. Custom Arena view/start/complete/resume/return events remain deliberately consent-gated and limited to an authored scenario ID/difficulty and return-day gap.
4. The browser SDK uses a pseudonymous identity in browser-local storage. This is **personal data where it can be linked to a person**; it is not anonymisation, and requests can expose normal network metadata to the provider. The site config attempts to disable Amplitude's explicit IP-address property, but that does not make connection metadata invisible to network processors.
5. Analytics preference withdrawal disables future custom events and removes the Arena last-visit marker. Previously transmitted provider-side data is not automatically erased. Contact flow handles requests for review/deletion; provider-level configuration still must be verified by the operator.
6. Practice Arena's optional researcher survey requires an adult self-confirmation before preparing feedback; only a deliberate email/copy action shares answers. Email sender addresses and mail-provider metadata are **not anonymous**. Research recruitment remains separate and requires the operator to ensure volunteers are adults.
7. Terms no longer purport to mandate ambiguous binding arbitration; they recognise mandatory rights and courts/regulators with jurisdiction.

## Relevant primary source checks

- Sri Lankan Data Protection Authority, PDPA [official notices](https://www.dpa.gov.lk/notice.php) and [statutes / gazettes](https://www.dpa.gov.lk/guidelines.php). The DPA states Gazette Extraordinary No. 2498/16 of 22 July 2026 schedules Sections 2 and 3, Part I and Part III for **1 January 2027**; other provisions have different commencement status. Check again before making any claim of full statutory compliance.
- [Amplitude Browser SDK 2 instrument & configure](https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2/instrument-and-configure): `autocapture:false` disables default auto capture, and project remote config can override local settings unless `fetchRemoteConfig:false`.
- [Amplitude session replay plugin](https://amplitude.com/docs/sdks/session-replay/session-replay-plugin): `sampleRate:1` is 100% replay; do not silently reinstate it.
- [ICO Children's Code guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/faqs-on-the-15-standards-of-the-children-s-code/): high privacy by default, profiling protections and child-specific risk assessment where applicable.

## Explicit external items NOT verified / NOT solved by a code-only change

- **Age assurance:** A self-attested 18+ checkbox is not proof of age, not parental consent, and not a complete children's privacy programme. Do not invite minors to the research pilot. Review age-appropriate controls across *all* TradeHQ features—not just Arena—if children are a foreseeable audience.
- **Google advertising / CMP:** Google scripts, regional ads controls, ad service and any processing through the father's AdSense account are independent of this Amplitude change. A Google CMP message and AdSense account settings must be audited directly. Do not interpret analytics rejection as an advertising preference.
- **Service provider agreements:** Review Supabase, Google, Cloudflare, Resend and Amplitude data-processing arrangements, transfer locations, retention, breach-handling procedures and deletion/export processes.
- **Legal scope / operator status:** Confirm the true publishing/controller identity, terms, jurisdiction, user targeting, licensing obligations and any required notices with qualified Sri Lankan counsel, and with suitable international advice if EU/UK/US/Indian child-directed use is intended.
- **Runtime confirmation:** On both hosting providers, verify a cold first visit without a v2 choice does not load Amplitude; reject has no analytics traffic; adult accept generates only explicitly authored milestones; withdrawal stops further traffic; and no replay plugin or auto events load. A browser check is a partial test, not a legal certification.
- **Historical data:** Previously recorded analytics or replay data, if any, may remain in Amplitude; this patch does not retroactively delete it. Owner must assess actual project retention and any deletion obligations.

## Rollout gates

1. Automated code/test checks for fresh-v2 consent, age gating, no replay/autocapture, restricted payloads, unchanged guest Arena and simulated portfolios.
2. Successful Cloudflare/Vercel deploy of the same merged SHA.
3. Human/data-protection review before claiming any jurisdiction-wide compliance or beginning research with minors.

**This release is one reasonable risk-reduction step, not legal advice or a compliance certificate.**
