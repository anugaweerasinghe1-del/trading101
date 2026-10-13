# Owner control authentication compatibility correction

After approved PR #133 was deployed, the owner reported that status and stop
showed the unavailable/unconfirmed message. Native Edge logs show two POST 401
responses at 13:40:53 and 13:40:57 UTC on 13 October 2026. The endpoint booted;
its deployed sources matched the approved commit and its database remained
stopped at generation zero. No failed stop was counted as a verified operation.

Source review found a new 24-character minimum in the control handler's master
key comparison. The existing administrator endpoints do not impose that rule.
The owner's key value/length was not read, so this is a demonstrated compatibility
defect, not a claim that its actual length has been independently established as
the sole cause of these production 401s. The defect is reproduced with a valid
existing-style key in the handler fixture and corrected to the existing contract:
nonempty exact key matching, bounded length, and fixed-length character comparison.
The separate server-verified, registered, confirmed, non-anonymous owner session
remains mandatory. No key rotation, permission, binding or SQL change is included.

Denials now distinguish administrator-key failure (401 ADMIN_KEY_REQUIRED),
missing/invalid verified session (401 OWNER_SESSION_REQUIRED), and wrong or
ineligible owner account (403 OWNER_ACCOUNT_REQUIRED). The UI maps only those
exact status/code combinations to fixed helpful messages. Other errors still
remain unavailable/unconfirmed, never a successful stop. Runtime diagnostics
emit only fixed code/status values, without identities, keys, tokens, request
payloads or exception details. A logging failure cannot change authentication.

The handler fixture tests a short existing-style configured key, wrong-key denial
before Auth, valid key with wrong owner denial, private diagnostic omission and
logger failure. Compiled Chromium checks real key/session denial messages in
addition to the existing stop/lock/race checks. All accounts and keys are isolated
fixtures. Exact-head CI and hosting previews must pass before owner-approved
merge/redeployment. Real owner-session retry remains required afterward; isolated
tests and ACTIVE deployment cannot replace that flow.
