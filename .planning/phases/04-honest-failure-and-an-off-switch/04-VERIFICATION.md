---
phase: 04-honest-failure-and-an-off-switch
verified: 2026-09-11T13:55:00+03:00
status: human_needed
score: 4/4 roadmap behaviours technically present; 14/17 current-source live checks observed
covered_files:
  - ".planning/REQUIREMENTS.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-VALIDATION.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-UAT.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-REVIEW.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-SECURITY.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-GAP-CLOSURE-COVERAGE.md"
  - ".planning/phases/04-honest-failure-and-an-off-switch/04-20-SUMMARY.md"
  - "extension/background.js"
  - "extension/content.js"
  - "extension/manifest.json"
  - "extension/popup.html"
  - "extension/popup.js"
  - "extension/zhroma.css"
  - "extension/icons"
  - "test/extension"
behavior_unverified: 3
overrides_applied: 0
gaps: []
human_verification:
  - "language-icon-copy remains pending under AR-04-01; no non-English Zendesk context was available."
  - "structure-copy remains pending under AR-04-01; no safely prepared uninterpretable table context was available."
  - "english-regional-locale remains pending after the user explicitly deferred it as non-blocking."
---

# Phase 4: Honest Failure and an Off Switch — Verification Report

**Phase Goal:** The agent can tell from the toolbar which of three states the extension is in, is told to add a Priority column only when that is certainly the problem, and can turn tinting off and back on without uninstalling.

**Verified:** 2026-09-11, after 04-15 through 04-20 gap closure and the current-source user walkthrough.

**Status:** `human_needed`. The implementation, review, security and validation-tool gates are technically clear. Human acceptance is not fully complete because three live checks remain pending by explicit risk acceptance or deferral.

## Goal Achievement

| # | ROADMAP success criterion | Current status | Evidence |
|---|---|---|---|
| 1 | On a view that has a Priority column the toolbar icon shows that tinting is working; on a view without one it shows a visibly different state, and opening the popup tells the agent to add the column. | Verified for current source within observed English/light scope | User passed `working-icon`, `blank-copy`, `missing-icon-hint`, `missing-settle-transition` and `navigation-status` on 2026-09-11. The validator binds these observations to the final reviewed source. |
| 2 | With the agent UI set to a language the extension does not read, the toolbar shows a third, distinct state and nothing anywhere claims the view is missing a Priority column. | Technically covered; live evidence still pending | Automated tests cover the unsupported-language branch and the malformed/English-regional distinctions. `language-icon-copy`, `structure-copy` and `english-regional-locale` remain pending: the first two under AR-04-01, and the regional-English check by explicit user deferral as non-blocking. |
| 3 | The popup carries an on/off switch that is already on; turning it off clears every tint from the view currently on screen without a refresh, and turning it back on restores them. | Verified for current source within observed scope | User passed `off-clears`, `on-restores` and `popup-keyboard` on 2026-09-11. The no-pressure off-state judgment was re-observed through the current popup path. |
| 4 | Quitting Chrome and reopening it preserves whichever way the switch was left. | Verified for current source within observed scope | User passed `restart-off`, `restart-on`, `cross-tab-preference`, `frozen-resume` and `worker-restart` on 2026-09-11. |

## Gate Inventory

| Gate | Result | Evidence |
|---|---|---|
| Runtime implementation | Passed | 04-19 final reviewed runtime revision `255ba31e2b25f7b8c5bde8a3900fb93151594f50`; runtime eleven-asset aggregate `46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`. |
| Independent code review | Passed | `04-REVIEW.md` reports zero current runtime blockers after the final 04-19 repair and recheck. |
| Security review | Technical clear with final evidence threats open | `04-SECURITY.md` records 66 mitigated, 12 accepted and four deferred final-evidence threats; no open technical security blocker remains. |
| Default tests | Passed | Final recorded default suite: 65 smoke checks and 994 Vitest tests passing. |
| Mutation gate | Passed | Complete mutation gate: 39/39 intended behavioural kills. |
| Synthetic Chrome timing | Passed | Seven actual Chrome synthetic runs, 4200 measurements and 420 warmups; largest enabled batch 13.6 ms, largest 30-row median 1.3 ms. |
| Acceptance validator | Passed | `test/extension/phase-04-live-acceptance.test.js` passes 94/94 and computes `human_needed`. |
| Current-source live acceptance | Human-needed | 14 of 17 checks passed. Three remain pending and are not represented as passes. |

## Pending Human Items

`language-icon-copy` and `structure-copy` remain pending under AR-04-01. That waiver permits progression; it does not create observation evidence and it does not verify FAIL-03 live behaviour.

`english-regional-locale` remains pending after the user said, "I don't know how to do this, defer, not a blocker." This is recorded as a non-blocking deferral in `limitations.unavailable_scenarios`, not as a pass.

All three product prohibition status fields remain `flagged-unverified` by design. Their human ratifications and qualifications are carried in disposition text, while the guard prevents an executor from silently promoting them to resolved.

## Conclusion

Phase 4 gap closure achieved its technical goal and gathered current-source live evidence for every check the user could safely perform in this session. The correct final disposition is still `human_needed`: no failed observation remains, but three live checks are pending and no canonical requirement should be promoted to complete from a waiver, a green suite or a deferral.
