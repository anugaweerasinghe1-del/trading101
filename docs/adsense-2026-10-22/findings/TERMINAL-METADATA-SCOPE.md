# THQ-059 — generic terminal title scope

Fresh production RUNE, RENDER, USDC, WLD, IMX and POL browser titles consistently say Analysis after main hydration and at +3/+8 seconds, while their main scope explicitly says TradeHQ has not published asset-specific research. These are not transient loading titles. Pepe retains the shorter practice-data title and is an unaffected control. All seven sample canonicals are correct and robots remain intentionally noindex, follow.

Source: src/lib/assetContent.ts generateAssetMetaTitle returns a named Practice Data & Educational Guide title, then substitutes Analysis when its length exceeds 60. Proposed minimal repair replaces that fallback word with Practice. Names/symbols remain for ambiguity prevention; custom titles, descriptions, canonical/robots and content stay unchanged. No title-length penalty or Google rejection-cause claim.

Only a reviewable one-line proposal is prepared. It must not enter an application candidate until PR259 production verification closes. Low risk; ordinary protected reviewed revert is rollback. Build/local metadata and responsive checks, actual native preview, exact candidate CI, protected merge and exact-main/native production/live/guest gates still required.
