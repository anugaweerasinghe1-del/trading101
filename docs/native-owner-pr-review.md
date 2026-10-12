# Native owner review evidence for AI draft proposals

The repository's existing owner-requested coding agent may prepare a **draft** pull request on an `ai/issue-N` branch. It does not merge or release that proposal.

To review an actual proposal safely:
1. Wait for independent PR CI and Cloudflare preview. Inspect the exact changed files, source diff and any financial/AdSense/YMYL claims.
2. Once a draft is ready for formal review, use GitHub's **Ready for review** control. The repository owner can then use GitHub's native **Approve** review on a bot-authored PR. No comment secret, token, admin password or signing key should ever be pasted into a public issue.
3. A read-only GitHub Actions job named **TradeHQ Native Owner PR Review Evidence** checks GitHub's independently fetched repository, live PR and native review records. It requires the actual numeric GitHub owner identity, GitHub Actions bot author, `main` target and unchanged exact approved head SHA. Dismissed, forged, stale or superseded reviews are rejected.
4. Success reports an auditable review witness **without authorizing code writes, backend repairs, merge, rollback or production release**. All existing mandatory CI, branch protection and routine human release controls remain in place.
5. If a bot proposal changes after approval, the owner must review the **new** commit; the previous witness is obsolete.

This flow incurs no new Gemini call, production database write, credential, schedule or paid provider dependency. It uses existing public-repository GitHub Actions and REST reads. The first live owner approval has **not** occurred yet, so this workflow cannot be called operationally demonstrated or counted as a new maturity stage until a legitimate review event succeeds.

This is **not** the separate offline Ed25519 + Supabase owner-repair-approval adapter, which remains disabled and undeployed. It is deliberately narrower: GitHub-native human review of a bot-proposed source patch only.
