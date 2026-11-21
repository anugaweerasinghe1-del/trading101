# TradeHQ — independent AdSense policy reference (2026-11-21)

Scope: public site and repository at main `1f71e5dec8e38ef4346f666ca4ade888b83572de`. References read from official Google documentation on 2026-11-21. This matrix provides review criteria, **not** an assertion that TradeHQ violates them. Always distinguish policies from approval-quality advice and publisher restrictions. Do not infer a reason for a historical generic rejection.

| ID | Classification | Official reference | Requirement / guidance | TradeHQ evidence / test |
| --- | --- | --- | --- | --- |
| G-01 | Mandatory AdSense program policy | [AdSense Program policies](https://support.google.com/adsense/answer/48182) | No artificial clicks/impressions or incentives or misleading ad placement | Inspect ad code, live network requests, incentives, ad/UI boundaries and traffic records if available; do **not** click ads |
| G-02 | Mandatory publisher policy | [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938) | No deceptive claims, scraped/copyright-violating content, or other prohibited content | Inspect every page-specific claim and source; find unsupported performance or ownership assertions |
| G-03 | Mandatory privacy-related publisher policy | [Google Publisher Policies, privacy disclosures](https://support.google.com/publisherpolicies/answer/10502938) | Privacy policy must describe relevant data collection/sharing/technology and third-party ad collection | Compare live privacy text with actual runtime, analytics, ad serving and partner services |
| G-04 | Publisher restriction (not automatically a prohibition) | [Google Publisher Restrictions](https://support.google.com/publisherpolicies/answer/10437795) | Specific types of inventory may receive limited demand | Classify an affected page under an actual restriction if found; do not claim blanket violation |
| G-05 | Eligibility | [Eligibility requirements](https://support.google.com/adsense/answer/9724) | Site ownership, original content, compliance; AdSense applicant at least 18 | Public content, publisher verification, ownership and identity evidence; account details currently unavailable |
| G-06 | Eligibility / account ownership | [Age requirement](https://support.google.com/adsense/answer/14230) | If owner is under 18, parent/guardian may sign up with their own account; publisher payments go to adult | Verify actual AdSense applicant's eligibility without inferring account holder identity |
| G-07 | Approval-readiness guidance | [Preparing your pages](https://support.google.com/adsense/answer/7299563) | Useful original content, clear navigation and user experience | Review entire published page content, link destinations and accessible journeys; no invented word minimum |
| G-08 | Approval-readiness guidance | [What to do when your site is not ready](https://support.google.com/adsense/answer/12176698) | Reachability, crawler access, adequate content and navigation | Compare robots.txt, site maps, login gates, canonical URLs and real rendered pages |
| G-09 | Approval-readiness guidance | [Why account wasn't approved](https://support.google.com/adsense/answer/81904) | Reasons include thin content, low originality, navigation, policy, traffic and unsupported language | Consider specific published criteria; never assign Google an unseen private decision |
| G-10 | Invalid traffic policy guidance | [Top invalid traffic and policy violations](https://support.google.com/adsense/answer/2660562) | Prohibited manipulated ad interactions | Inspect implementation and promotions; account traffic logs unavailable |
| G-11 | Policy updates | [Publisher change log](https://support.google.com/publisherpolicies/answer/10852414) | Current October 2026 video-inventory restrictions update | Only relevant if TradeHQ serves qualifying video inventory |
| G-12 | Conditional consent requirement | [Google-certified CMP requirements](https://support.google.com/adsense/answer/13554116) | Check applicable geographic consent / publisher-product requirements before any future ad serving | Current public About and privacy text state AdSense serving disabled; an analytics toggle is not CMP evidence |

## Interpretation guardrails

* A script alone is not proof an ad was served. Current production and repository evidence must be inspected to determine whether serving is enabled.
* SEO guidance and good design choices are not automatically AdSense policy violations.
* Passing functional tests is not proof of content originality or future Google approval.
* A publisher restriction is not identical to a prohibited-content violation.
* Google alone determines AdSense approval. Real account status and applicant age must be established with the responsible adult when required.

## Existing history, not new independent findings

The [14 November evidence ledger](../adsense-2026-11-14/MASTER-LEDGER.md) documents a previously fixed advertising-bootstrap issue under THQ-ADS-001, and remaining external and authenticated verification gates THQ-ADS-002/003. Do not count historical findings as independently reproduced new issues without current evidence.
