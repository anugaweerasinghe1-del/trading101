# Reproducible publisher source-block inventory (22 November 2026)

This audit capture contains **only the three already-public, already-published** dynamic-course documents and no account/user or pending draft course rows. The source-read snapshot is immutable audit evidence, not a new publication. The app still uses its existing approved-course source and exact-match correction overlay. New publication is not authorized.

Run `node --import tsx scripts/generate-editorial-block-receipt.mjs` after dependencies are installed. The script verifies that all 163 canonical routes are inventoried, checks 151 static pages plus 12 dynamic documents, and emits a page CSV, block SHA256 JSONL and summary as a CI artifact. **Every block is explicitly marked individually un-attested** because deterministic extraction or a page-level text pass does not establish that each rendered paragraph and image was independently reread and verified. Correct denominators and open gates are mandatory; no one may turn this receipt into Google approval, rights certification, full live test or completed #430.

CI runs the inventory after the normal required build and uploads the read-only receipt; any discrepancy fails the corresponding gate. Snapshot date and source must be reconciled again if a published course is revised. This does not change user accounts, analytics, ads or live content.
