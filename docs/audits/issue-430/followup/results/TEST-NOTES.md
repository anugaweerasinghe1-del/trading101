# Test scope and setup notes

The final verified result files are the completion evidence. Earlier attempts are not silently counted as passes.

- Local Chromium initially sent localhost traffic through the external proxy and received 403. Local testing was corrected to use no proxy; hosted preview testing uses the normal proxy.
- The content test initially required native-only About wording in the interactive view and read collapsed FAQ answers. It was corrected to inspect the appropriate view and open the exact changed questions.
- An initial FAQ loop used selectors whose membership changed while opening controls. Stable labelled controls replaced it. These timeouts were test setup issues, not site failures.
- Mobile order entry requires opening the actual Trade AAPL drawer before the quantity input appears. The fixture now follows that flow.
- Native noncanonical asset/sector routes intentionally have brief simulator fallbacks. These are checked for their actual scope and absence of obsolete claims; the test does not pretend they contain the entire interactive terminal.
- Setting Trading Goals has stable legacy ID5, not ID6. The actual source mapping was checked before fixing the expected route. Hub summaries had a separate copy; they now use the canonical lessonData descriptions.
- A real populated-mobile defect was isolated separately: a chart tooltip widened the document from360px to455px. DOM offenders and a screenshot are retained; the bounded tooltip fix passes the same guest flow. This is THQ-430-017, not a test setup mismatch.

Only isolated browser-local guest orders, lesson responses and a controlled-date daily answer were entered. Remote writes, analytics acceptance, emails, models, publication and account changes were prevented by the browser route allowlist. The distinct connected source-draft save attempts expired and were independently verified as having no effect; no database writes were retried after the user queried the warning.

The metadata extension initially inspected the selected-asset teaching body immediately after Helmet painted the route metadata, before the asset-selection effect completed. Its paragraph assertion now waits for the actual expected passage rather than reading the transient Select an asset shell. Metadata checks and settled body checks are kept distinct.
