# Portfolio evidence tools

The browser scripts accept an explicit origin and output prefix (price/target cases also accept `before` or `after`). They use installed Chromium through Python Playwright, disposable guest storage, same-origin GET routing, and labelled quote/permission fixtures. Account fixtures enforce a loopback origin. They make no real account or provider calls. Scratch output is `/tmp/tradehq-audit-1118/portfolio`; create that directory first.

`p10-validate-ledger.py EVIDENCE_DIRECTORY --require-closed` checks declared content hashes, artifact references, two-pass status and source-expression mappings. Without the flag it reports pending reviews without treating an open page as an integrity failure. This validates records and cannot establish editorial correctness.

Replaying fixtures does not create reading credit. Do not run the historical `before` assertions against corrected content. Preserve the captured before artifacts.
