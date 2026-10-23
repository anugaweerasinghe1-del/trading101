# Audit helper source snapshots

These are the final versions of the read-only verification helpers used during this continuation, retained for review. They contain the workspace paths and CDP port used in this cloud session. Earlier captures may predate the added navigation diagnostics; see RESUMED-VALIDATION-NOTES.json. They are not product code or proof of exhaustive human review.

The native helper reads trusted exact-main GitHub checks/job logs and selects authenticated Cloudflare/Vercel deployment metadata. It does not merge or mutate providers. Browser helpers use the audit's disposable anonymous Chromium profile, prevent unapproved Supabase mutations, and write local receipts/screenshots. The guest helper also prevents the potentially mutating public-duels RPC. Badge fixtures restore the audit browser's own prior local progress.

A browser helper's SHA argument labels the separately bound native/provider proof; it is not standalone cryptographic deployment verification. Only replay against a newly verified current SHA. Explicit managed-proxy 503 failures can receive bounded normal-navigation retries; expected product assertions remain unchanged. No proxy, TLS or security control is bypassed.

The repository's versioned compiled-browser regression remains scripts/verify-publisher-browser.mjs on main. The required GitHub workflows run that broader isolated regression against exact candidate commits. These public-browser receipts complement that CI; they do not certify private accounts, financial calculations, all 441 pages or Google eligibility.
