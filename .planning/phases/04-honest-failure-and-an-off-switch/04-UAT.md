---
status: diagnosed
phase: 04-honest-failure-and-an-off-switch
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-06-SUMMARY.md, 04-LIVE-ACCEPTANCE.md, 04-VALIDATION.md
started: 2026-09-10T07:21:08Z
updated: 2026-09-10T10:03:42Z
---

## Current Test

[testing complete]

## Notes

**Plan 04-05 has no SUMMARY.md.** Its five artifacts all exist on disk (`04-LIVE-ACCEPTANCE.md`, `04-VALIDATION.md`, `04-PERFORMANCE.md`, `04-PERFORMANCE-SAMPLES.json`, `test/extension/phase-04-live-acceptance.test.js`) and its Tasks 1-2 completed; the plan is `autonomous: false` and halts at a blocking human checkpoint, which is Task 3 — this UAT session. The missing SUMMARY is expected mid-plan state, not lost work.

**Coverage blocks are malformed in four SUMMARYs.** `04-02`, `04-03`, `04-04` and `04-06` use `kind: test` / `kind: command` in their `coverage[].verification[]` entries. The accepted vocabulary is `unit | integration | e2e | automated_ui | manual_procedural | other`, so `gsd_run query uat.classify-coverage` reports `invalid_kind` for 47 verification entries and downgrades 31 deliverables to `validation_failed` — meaning it cannot auto-pass them. This is a labelling defect, not missing evidence: the refs name real tests and the suite is green. Rather than auto-passing on the strength of an unparseable block, coverage was re-established by measurement in this session:

- `npm test` → **65** `node --test` + **518** Vitest across 14 files, **0 failures**, exit 0.
- 93 `kind: test` refs checked against real `it()`/`test()`/`test.each()` names: **all resolve** (14 initially unmatched are `test.each` template names such as `'%s is a locally authored 32x32 PNG'` and bracket-shorthand for parameterised cases).
- The one `status: fail` in the phase (`04-02` D7, inherited suites failing) was closed by `04-06`; those suites now pass.
- All **11** shipped assets in `extension/` hash-match `04-LIVE-ACCEPTANCE.md` `source.assets` exactly, and `extension/` is clean in git — so the acceptance record is validly bound to the bytes under test.

The 31 entries below are therefore recorded `result: pass`, `source: automated`, with `coverage_note: malformed-kind-remeasured`. **The `kind` values should be corrected in those SUMMARYs** so the classifier can do this without a human in the loop next time.

**Commit-claim reconciliation (#3968):** all five SUMMARYs carry `plan_head_before` but no `commits:` field (pre-#3968 legacy) → WARNING, not mismatch. Measured git activity after each base: 04-01 → 26, 04-02 → 22, 04-03 → 14, 04-04 → 9, 04-06 → 17. No `commit_claim_mismatch`.

**Automated UI verification:** not available — no Playwright MCP in this session, and `workflow.live_dom_uat` is `false`. All UI checkpoints fall through to manual review. UI checkpoints: 0 auto-verified, 17 queued for manual review.

**Verify:pre gate `api-coverage.verify-pre`:** passed (`block: false`) — `COVERAGE.md` declares no external API integration.

**Five human-judgment coverage entries** (`04-01` D4, `04-02` D6, `04-03` D8, `04-04` D10, `04-06` D7) are not duplicated as separate tests. Four are supplied by the live observations below (tests 2-17) plus the prohibition ratifications (18-20). `04-06` D7 — "whether the restored suites are the RIGHT suites" — is an independent-code-review judgment and belongs to the `independent_code_review: not-performed` gate, recorded as blocked below.

## Tests

### 1. Source confirmation
expected: The unpacked `extension/` directory from THIS repository is loaded (or reloaded) in `chrome://extensions`, and the Zendesk document has been refreshed once so the new content-script instance is the one under test. The eleven shipped assets hash-match `04-LIVE-ACCEPTANCE.md` `source.assets` — already verified mechanically in this session, all 11/11 match and `extension/` is clean in git, so you only need to confirm the loaded directory IS this repo. Then report: Chrome version, OS, that the view is the English (`html[lang="en"]`) current Agent Workspace in LIGHT appearance, and the actual mounted ticket-row count (count it; do not infer it).
result: pass
note: "Loaded directory confirmed as this repository. Chrome version, OS, interface language, appearance and mounted row count were NOT supplied in the response, so 04-LIVE-ACCEPTANCE.md environment.* stays null and source_confirmed_on stays unset — these are needed before the canonical record can be promoted."

### 2. working-icon
expected: Open an existing supported view that has a Priority column with values. Tint appears WITHOUT refreshing. The toolbar shows the CHECK artwork with title "Priority tinting is working"; the popup reads the same. Icon and popup agree. (D-02, FAIL-01, FAIL-05)
result: pass

### 3. blank-copy
expected: Open a view that HAS a Priority column but where the visible tickets have NO priority values set. The toolbar still shows the CHECK artwork — this is a working state, not a failure. The popup reads "Priority column found. These tickets have no priority values set". It never says the column is missing. (D-02)
result: pass

### 4. missing-icon-hint
expected: On a table you have confirmed is supported and fully rendered but which has NO Priority column: the toolbar shows the COLUMN-PLUS artwork, visually distinct from the check. The popup reads "Add a Priority column to this view to use tinting". No hint, banner or badge is written into the Zendesk page itself. (D-01, D-03, FAIL-02)
result: pass

### 5. missing-settle-transition
expected: Watch the icon while a Priority-less table mounts or is replaced (enter the view, or switch to it and back). While mounting the icon is the neutral HOLLOW CIRCLE, not the column-plus. The missing-column claim appears only after the table settles — header row plus a width-matched ticket row present, and ~100 ms of quiet. It never flashes a missing claim mid-mount. (D-01, FAIL-02)
result: pass

### 6. language-icon-copy
expected: In a context YOU control, switch the Zendesk interface to a non-English language, then open a ticket view. The toolbar shows the QUESTION-MARK artwork and the popup reads "This interface language is not supported". It does NOT claim a Priority column is missing and does not echo any view content. Report only the language tag (e.g. `de`). (D-04, D-08, FAIL-03)
result: skipped
reason: "defer, I cannot test this — subsequently WAIVED by the user as accepted residual risk AR-04-01 (04-RISK-ACCEPTANCE.md, WINDOWS.md entry 12). Reclassified blocked -> skipped because the waiver resolves it as a decision; it is no longer awaiting a prerequisite. The check itself remains status: pending in 04-LIVE-ACCEPTANCE.md — the waiver permits progression, it does not create evidence."
disposition: "Stays pending in 04-LIVE-ACCEPTANCE.md with a reason under limitations.unavailable_scenarios. No non-English tenant context available to the user. NOT a defect and NOT a gap — a prerequisite gate. FAIL-03 remains pending-human and this blocks a passed disposition on the canonical record (promotion rule 1)."

### 7. structure-copy
expected: In a safely prepared, user-approved context where the ticket table cannot be interpreted (NOT an operational view, and no ticket data mutated): the toolbar shows the QUESTION-MARK artwork and the popup reads "Zhroma cannot read this view's ticket table". An English view is never told its language is unsupported. If no safe context exists, this stays pending with a reason — do not edit an operational view to manufacture it. (D-04, FAIL-03)
result: skipped
reason: "defer — no safe context available; subsequently WAIVED by the user as accepted residual risk AR-04-01 (04-RISK-ACCEPTANCE.md, WINDOWS.md entry 12). Reclassified blocked -> skipped for the same reason as test 6. The check itself remains status: pending in 04-LIVE-ACCEPTANCE.md."
disposition: "No safely prepared, user-approved uninterpretable-table context available. Stays pending in 04-LIVE-ACCEPTANCE.md under limitations.unavailable_scenarios, exactly as the check itself prescribes. NOT a defect and NOT a gap. FAIL-03 now has BOTH its live checks (language-icon-copy, structure-copy) unobserved."

### 8. off-clears
expected: On a tinted view, open the popup and turn "Enable priority tinting" OFF. Do not refresh. Every tint disappears from the current view immediately, with no reload. The popup reads "Tinting is off" and the toolbar shows the POWER-SYMBOL artwork. Nothing implies off is an error or invites you to turn it back on. (CTRL-02, CTRL-04, D-10)
result: pass

### 9. on-restores
expected: Turn the switch back ON. Do not refresh. Tint returns on the current view immediately and matches the priorities as they are NOW, including any that changed while it was off. (CTRL-02, CTRL-04)
result: pass

### 10. restart-off
expected: Leave the switch OFF. Quit Chrome completely and reopen it, then return to the view. The switch is still off, the view is untinted, and the toolbar still shows the power symbol. (CTRL-03 — a real restart, not context recreation)
result: pass

### 11. restart-on
expected: Leave the switch ON. Quit Chrome completely and reopen it, then return to the view. The switch is on and the tint is back. (CTRL-03)
result: pass

### 12. cross-tab-preference
expected: Open two Zendesk view tabs. Flip the switch in one, then look at the other. The preference is global: both tabs converge on it. Each tab keeps its OWN diagnosis — the other tab's status describes the view IT is showing. Convergence is not promised to be instantaneous. (CTRL-03, D-06)
result: pass

### 13. frozen-resume
expected: Leave a Zendesk tab in the background long enough for Chrome to freeze/discard it. Flip the preference elsewhere. Return to the frozen tab. On resume the tab applies the CURRENTLY PERSISTED intent — no stale tint left behind, and no reversion to the value it froze with. (CTRL-03, D-10)
result: pass

### 14. nonreceiver-status
expected: Open the popup on a tab where no Zhroma content script is running (a new tab page, or any non-Zendesk page). The popup reads "No readable view is connected". It does NOT assert the tab is outside Zendesk and does not invent a diagnosis about a view it cannot see. (D-11, decided copy)
result: pass

### 15. navigation-status
expected: With the popup closed, move between tabs and documents — including from a tinted view to a non-view surface and back. The icon and popup always describe the CURRENT document. A previous tab's positive "working" state is never carried over to a tab where it is not true. (FAIL-05)
result: pass

### 16. worker-restart
expected: In `chrome://extensions`, use the service-worker control to stop/restart the extension worker in this controlled test session. Then look at the icon and popup. Status is rebuilt from a fresh request to the current document, not recalled. No stale diagnosis reappears, and nothing needs a page refresh to recover. (FAIL-05, CTRL-03)
result: pass

### 17. popup-keyboard
expected: Open the popup and operate it with the KEYBOARD ONLY: Tab to the switch, toggle with Space, read the status line. Focus lands on the switch by default and is clearly visible. Its label reads "Enable priority tinting" and the announced state matches what is actually stored. Turning it off produces no nag, warning tone or prompt to re-enable. (CTRL-02, D-11)
result: pass

### 18. no-agent-blame (prohibition judgment)
expected: PROHIBITION RATIFICATION, not an observation. The diagnosis must not blame an agent or imply they caused an unsupported or malformed view. Tests prove the copy is finite, fixed and branched on actual evidence. Your judgment is needed on whether "Add a Priority column to this view to use tinting" (and the other diagnosis copy you saw above) reads as HELP rather than as ACCUSATION. Currently `flagged-unverified`, and it blocks a `passed` disposition.
result: pass
disposition: "User ratified: copy reads as help, not accusation. no-agent-blame resolved — flagged-unverified cleared by explicit user judgment."

### 19. re-enable-not-pressured (prohibition judgment)
expected: PROHIBITION RATIFICATION. The off switch must not pressure the agent to re-enable tinting or imply that off is an error. Tests prove off has its own packaged artwork, its own copy, and no accompanying hint. Your judgment is needed on whether the off state FEELS like a legitimate choice rather than a broken or discouraged one. Currently `flagged-unverified`, and it blocks a `passed` disposition.
result: pass
disposition: "User ratified: off reads as a legitimate choice, not a broken or discouraged state. re-enable-not-pressured resolved — flagged-unverified cleared by explicit user judgment."

### 20. untested-is-not-consent (prohibition judgment)
expected: PROHIBITION RATIFICATION. Untested browser behavior must not be presented as observed acceptance or consent. The validator enforces the mechanical half — a `pending` check cannot compute to `passed`. The remaining half is how this record is read and reported. Your judgment is needed on whether this UAT session, and the report it produces, keeps untested things visibly untested. Currently `flagged-unverified`, and it blocks a `passed` disposition.
result: pass
reported: "it's a pass, the blocked tests are no blockers"
disposition: "User ratified untested-is-not-consent AND explicitly accepted the two blocked checks as non-blocking for phase progression. Recorded as attributed acknowledged risk, NOT as evidence: language-icon-copy and structure-copy remain status pending in 04-LIVE-ACCEPTANCE.md, so FAIL-03 ships with zero live evidence. Promotion rule 1 is mechanically enforced by test/extension/phase-04-live-acceptance.test.js — the canonical record still computes to human_needed and was NOT flipped to passed. The user waived the gate for progression; the record continues to state the truth."

### 21. WINDOWS.md entry 11 — copy-set ratification
expected: USER DECISION, not an observation. 04-04 added TWO operational copy strings beyond your 04-01 decided set, because the plan mandates finite honest failure text and the decided set contained none for a failure of Zhroma's own action:
  1. "Zhroma could not save that setting"
  2. "Setting saved, but this view did not update"
Both are statements about ZHROMA's own action, never a diagnosis about the view, so the three product diagnoses stay three. The copy set was YOUR decision, so this addition needs your ratification (or rejection) before ship. It is open in `WINDOWS.md` as entry 11 and is not self-ratified.
result: pass
disposition: "User RATIFIED both operational copy strings — \"Zhroma could not save that setting\" and \"Setting saved, but this view did not update\". WINDOWS.md entry 11 can be closed as ratified-by-user. The three product diagnoses remain three."

### 22. Independent code review — suite adequacy (04-06 D7)
expected: A reviewer other than the implementing agent judges, against the final Phase 4 source, whether the restored assertion set is the right one. A green suite proves the assertions run and hold; it cannot establish that the assertion set is adequate.
result: issue
reported: "gsd-code-reviewer, 04-REVIEW.md: 1 Critical, 10 Warnings, 9 Info across 17 files. suite_adequacy: ADEQUATE-WITH-GAPS (43 mutants, 17 survived). regression_hazard: CORRECT-AS-DOCUMENTED."
severity: blocker
blocked_by: third-party
reason: "04-VALIDATION.md records independent_code_review: not-performed and security_asvs_level1: not-performed. Not self-awardable by the implementing agent or by this UAT session. Run /gsd-code-review 4 and /gsd-secure-phase 4."

### 23. [04-01 D1] Toolbar vocabulary and operational states chosen by the user and recorded verbatim (choice=distinct-icons, confirmed=true)
expected: Toolbar vocabulary and operational states chosen by the user and recorded verbatim (choice=distinct-icons, confirmed=true)
result: pass
source: automated
coverage_id: D1
requirement: FAIL-01

### 24. [04-01 D2] Preference scope, storage and propagation chosen by the user and recorded verbatim (choice=global-local, confirmed=true)
expected: Preference scope, storage and propagation chosen by the user and recorded verbatim (choice=global-local, confirmed=true)
result: pass
source: automated
coverage_id: D2
requirement: CTRL-03

### 25. [04-01 D3] Popup copy and help boundary chosen by the user and recorded verbatim (choice=concise-no-link, confirmed=true)
expected: Popup copy and help boundary chosen by the user and recorded verbatim (choice=concise-no-link, confirmed=true)
result: pass
source: automated
coverage_id: D3
requirement: FAIL-02

### 26. [04-02 D1] Actual extension bytes tint the admitted supported fixture and report working in that tab's action and popup, end to end through content, worker and popup
expected: Actual extension bytes tint the admitted supported fixture and report working in that tab's action and popup, end to end through content, worker and popup
result: pass
source: automated
coverage_id: D1
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-01

### 27. [04-02 D2] A stored false, a rejected read, a throwing storage API, a non-boolean and a null all leave zero markers, and no tint flashes during asynchronous startup
expected: A stored false, a rejected read, a throwing storage API, a non-boolean and a null all leave zero markers, and no tint flashes during asynchronous startup
result: pass
source: automated
coverage_id: D2
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-03

### 28. [04-02 D3] Phase 3's acceptance record still validates against exactly its original bytes and its eleven passed / nine pending outcomes, after Phase 4 changed extension/
expected: Phase 3's acceptance record still validates against exactly its original bytes and its eleven passed / nine pending outcomes, after Phase 4 changed extension/
result: pass
source: automated
coverage_id: D3
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 29. [04-02 D4] The message boundary is finite and private: exact sender identity, exact schema, bounded request ids, and no ticket value, DOM, URL or raw error in any payload
expected: The message boundary is finite and private: exact sender identity, exact schema, bounded request ids, and no ticket value, DOM, URL or raw error in any payload
result: pass
source: automated
coverage_id: D4
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 30. [04-02 D5] The permission surface stays frozen while action, popup, worker and icons are added, and every packaged asset resolves locally with no remote reference
expected: The permission surface stays frozen while action, popup, worker and icons are added, and every packaged asset resolves locally with no remote reference
result: pass
source: automated
coverage_id: D5
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-05

### 31. [04-02 D7] Full inherited regression compatibility across runtime-contract, initial-tint and persistent-tint
expected: Full inherited regression compatibility across runtime-contract, initial-tint and persistent-tint
result: pass
source: automated
coverage_id: D7
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 32. [04-03 D1] A missing-column claim requires all three D-01 conditions and appears only after 100 ms of quiet; any relevant change withdraws it in the same turn
expected: A missing-column claim requires all three D-01 conditions and appears only after 100 ms of quiet; any relevant change withdraws it in the same turn
result: pass
source: automated
coverage_id: D1
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-02

### 33. [04-03 D2] Every other shape of incomplete or broken evidence stays neutral or cannot-read and can never produce a missing-column claim
expected: Every other shape of incomplete or broken evidence stays neutral or cannot-read and can never produce a missing-column claim
result: pass
source: automated
coverage_id: D2
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-02

### 34. [04-03 D3] Unsupported locale and structural unreadability share the third state but carry truthful, different copy, and no language string reaches the wire
expected: Unsupported locale and structural unreadability share the third state but carry truthful, different copy, and no language string reaches the wire
result: pass
source: automated
coverage_id: D3
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-03

### 35. [04-03 D4] A blank Priority column is working with the no-values-set line, never a missing-column claim (D-02)
expected: A blank Priority column is working with the no-values-set line, never a missing-column claim (D-02)
result: pass
source: automated
coverage_id: D4
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-01

### 36. [04-03 D5] Three diagnoses reach the toolbar as three distinct packaged PNG shapes and three distinct explanatory titles, per tab
expected: Three diagnoses reach the toolbar as three distinct packaged PNG shapes and three distinct explanatory titles, per tab
result: pass
source: automated
coverage_id: D5
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-05

### 37. [04-03 D6] A stale reply, a navigation event, a recreated worker or a closed tab cannot overwrite the latest status, and every timer and queue settles
expected: A stale reply, a navigation event, a recreated worker or a closed tab cannot overwrite the latest status, and every timer and queue settles
result: pass
source: automated
coverage_id: D6
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 38. [04-03 D7] The page is left visually untouched in every diagnosis: the add-a-column hint exists only inside the popup (D-03)
expected: The page is left visually untouched in every diagnosis: the add-a-column hint exists only inside the popup (D-03)
result: pass
source: automated
coverage_id: D7
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-02

### 39. [04-04 D1] The popup carries one native labelled default-on switch; turning it off clears the current view's owned markers with no reload, and turning it on restores tint reflecting priorities that changed while it was off
expected: The popup carries one native labelled default-on switch; turning it off clears the current view's owned markers with no reload, and turning it on restores tint reflecting priorities that changed while it was off
result: pass
source: automated
coverage_id: D1
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-02

### 40. [04-04 D2] The setting survives a browser restart in both states as exactly one boolean, and a stale startup read cannot re-enable a view the agent switched off
expected: The setting survives a browser restart in both states as exactly one boolean, and a stale startup read cannot re-enable a view the agent switched off
result: pass
source: automated
coverage_id: D2
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-03

### 41. [04-04 D3] The persistent off is provably distinct from the temporary hidden/pagehide pause, in both directions (D-10)
expected: The persistent off is provably distinct from the temporary hidden/pagehide pause, in both directions (D-10)
result: pass
source: automated
coverage_id: D3
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-03

### 42. [04-04 D4] A storage or cleanup failure is reported honestly, with persistence and application distinguished and neither claimed on the strength of the other
expected: A storage or cleanup failure is reported honestly, with persistence and application distinguished and neither claimed on the strength of the other
result: pass
source: automated
coverage_id: D4
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-04

### 43. [04-04 D5] Exactly one boolean is persisted, by exactly one writer, in exactly one area; no ticket content, diagnosis, revision or per-tab value reaches storage or the wire
expected: Exactly one boolean is persisted, by exactly one writer, in exactly one area; no ticket content, diagnosis, revision or per-tab value reaches storage or the wire
result: pass
source: automated
coverage_id: D5
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-03

### 44. [04-04 D6] off is packaged as its own 32x32 shape, projected per tab, and never accompanied by the add-a-Priority-column copy
expected: off is packaged as its own 32x32 shape, projected per tab, and never accompanied by the add-a-Priority-column copy
result: pass
source: automated
coverage_id: D6
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-01

### 45. [04-04 D7] Race and fault interleavings preserve the authoritative preference and the current-document status; the suite goes quiet and every timer drains
expected: Race and fault interleavings preserve the authoritative preference and the current-document status; the suite goes quiet and every timer drains
result: pass
source: automated
coverage_id: D7
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 46. [04-04 D8] The packaging contract is re-pinned to the five-icon inventory with every prohibition retained at undiminished strength
expected: The packaging contract is re-pinned to the five-icon inventory with every prohibition retained at undiminished strength
result: pass
source: automated
coverage_id: D8
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-01

### 47. [04-04 D9] The popup is operable from the keyboard with a meaningful accessible name and a non-repeating status announcement
expected: The popup is operable from the keyboard with a meaningful accessible name and a non-repeating status announcement
result: pass
source: automated
coverage_id: D9
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-02

### 48. [04-06 D1] Every inherited initial-tint and persistent-tint assertion runs against current shipped bytes through the strict Chrome seam
expected: Every inherited initial-tint and persistent-tint assertion runs against current shipped bytes through the strict Chrome seam
result: pass
source: automated
coverage_id: D1
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-01

### 49. [04-06 D2] An unconfirmed, rejected, throwing, false or non-boolean preference leaves the controller dormant — zero markers, zero active observers, zero pending timers
expected: An unconfirmed, rejected, throwing, false or non-boolean preference leaves the controller dormant — zero markers, zero active observers, zero pending timers
result: pass
source: automated
coverage_id: D2
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: CTRL-03

### 50. [04-06 D3] runtime-contract still pins the permission surface, the match pattern, world, all_frames and the no-network / no-console / no-web-storage / no-colour / no-CSS-write prohibitions at undiminished strength
expected: runtime-contract still pins the permission surface, the match pattern, world, all_frames and the no-network / no-console / no-web-storage / no-colour / no-CSS-write prohibitions at undiminished strength
result: pass
source: automated
coverage_id: D3
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)
requirement: FAIL-05

### 51. [04-06 D4] The synthetic browser workload obtains real current-source tint after a confirmed initialization, and disabled mode produces no content callbacks
expected: The synthetic browser workload obtains real current-source tint after a confirmed initialization, and disabled mode produces no content callbacks
result: pass
source: automated
coverage_id: D4
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 52. [04-06 D5] The tracer's fake Chrome and the inherited-suite harness enforce one preference and status contract, anchored to the shipped literals
expected: The tracer's fake Chrome and the inherited-suite harness enforce one preference and status contract, anchored to the shipped literals
result: pass
source: automated
coverage_id: D5
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

### 53. [04-06 D6] Phase 3's acceptance record and its timing samples are unchanged by this plan
expected: Phase 3's acceptance record and its timing samples are unchanged by this plan
result: pass
source: automated
coverage_id: D6
coverage_note: malformed-kind-remeasured (classifier reason: validation_failed)

## Summary

total: 53
passed: 50
issues: 1
pending: 0
skipped: 2
blocked: 0

## Acknowledged Risk

<!-- Attributed user waivers. NOT evidence. -->

- id: AR-04-UAT-01
  statement: "The two blocked live checks are accepted as non-blocking for phase progression."
  formalized_as: "AR-04-01 — .planning/phases/04-honest-failure-and-an-off-switch/04-RISK-ACCEPTANCE.md"
  second_waiver_verbatim: "waive the pendings one from FAIL-03"
  windows_ledger_entry: 12
  attributed_to: user
  verbatim: "it's a pass, the blocked tests are no blockers"
  date: 2026-09-10
  consequence: |
    language-icon-copy and structure-copy remain status: pending in 04-LIVE-ACCEPTANCE.md.
    They are FAIL-03's ONLY two live checks, so FAIL-03 ships with automated coverage and
    ZERO live evidence. Promotion rule 1 is mechanically enforced by
    test/extension/phase-04-live-acceptance.test.js: the canonical record still computes to
    human_needed and was NOT flipped to passed. The waiver permits progression; it does not
    manufacture the observation.

- id: AR-04-UAT-02
  statement: "RESOLVED — source-confirmation environment details were supplied on request."
  attributed_to: user
  resolved: 2026-09-10
  supplied: "Chrome 152, macOS 27 beta 6, 30 mounted rows, English + light"
  date: 2026-09-10
  consequence: |
    Now recorded. 04-LIVE-ACCEPTANCE.md carries loaded_from_repository: true,
    source_confirmed_on: 2026-09-10, environment {browser: "Chrome 152", os: "macOS 27 beta 6",
    mounted_rows: 30, interface_language: "en", appearance: "light"}, and the fourteen reachable
    observations as status: pass / evidence_kind: live. Validator green: 38/38 on
    phase-04-live-acceptance.test.js, 518/518 full suite. Record disposition remains
    human_needed — two pending checks, mechanically enforced.

## Resolved by this session

- prohibition: no-agent-blame — RATIFIED by user (test 18).
- prohibition: re-enable-not-pressured — RATIFIED by user (test 19).
- prohibition: untested-is-not-consent — RATIFIED by user (test 20).
  NOTE: all three ratifications are recorded in each entry's `disposition` text in
  04-LIVE-ACCEPTANCE.md, but their `status` fields remain `flagged-unverified`.
  phase-04-live-acceptance.test.js asserts the repository record carries all three that
  way — a guard against an executor self-ratifying them. Promoting the status fields
  requires changing that guard: a user decision, deliberately NOT taken as a side effect
  of running UAT. Nothing turns on it while two checks are pending.
- WINDOWS.md entry 11 — copy set RATIFIED by user (test 21). Both operational strings
  accepted: "Zhroma could not save that setting" / "Setting saved, but this view did not update".
  Ledger entry 11 now closed as status: fixed with the ratification recorded.
- FAIL-03 live evidence — WAIVED by user as accepted residual risk AR-04-01
  (04-RISK-ACCEPTANCE.md); WINDOWS.md entry 12 opened as kind: accepted-risk. The two
  checks remain status: pending in the canonical record: a waiver permits progression,
  it does not create evidence and cannot promote the record.

## Outstanding — not resolvable in this session

- independent_code_review: not-performed — needs a reviewer other than the implementing
  agent, against final Phase 4 source. Carries 04-06 D7 (suite adequacy). Run /gsd-code-review 4.
- security_asvs_level1: not-performed — needs independent security review. Run /gsd-secure-phase 4.
- goal_verification: no *-VERIFICATION.md exists for Phase 4 — phase advancement is blocked
  on it. Run /gsd-execute-phase 04 (resumes at the verification gates; does not re-run
  plans that already have a SUMMARY.md).
- Seven unclassified edge assumptions (FAIL-01/02/03/05, CTRL-02/03/04) from
  04-SOURCE-AUDIT.md remain unresolved=7. A passing test does not change a probe classification.
- Malformed coverage `kind` values in 04-02/03/04/06 SUMMARYs — should be corrected to the
  accepted vocabulary so the classifier can auto-pass without a human next time.

## Gaps

<!-- 0 issues from the 21 human checkpoints. Both gaps below come from the independent
     code review (04-REVIEW.md), which is the gate the human checkpoints could not supply. -->

- gap_id: G-04-22a
  truth: "An unsupported interface language is never falsely claimed, and a supported English interface always tints (FAIL-03, D-04)"
  status: failed
  reason: "Independent review CR-01: extension/content.js:64 compares document.documentElement.lang !== 'en' as an exact case-sensitive string, so en-US, en-GB, en-AU and every other English regional locale is diagnosed 'This interface language is not supported' and never tints. zhroma.css:1,8,15,22 independently require html[lang=\"en\"], so a JS-only fix reports working with no paint — both must change together. Pinned as intended by initial-tint.test.js:166, persistent-tint.test.js:122 and runtime-contract.test.js:261, so those tests must change too."
  severity: blocker
  test: 22
  artifacts:
    - path: extension/content.js
      issue: "exact-match lang comparison at :64 rejects every English regional locale"
    - path: extension/zhroma.css
      issue: "all four tint rules require html[lang=\"en\"] exactly (:1,:8,:15,:22)"
    - path: test/extension/initial-tint.test.js
      issue: "':166' pins 'en-US' as an invalid variant"
    - path: test/extension/persistent-tint.test.js
      issue: "':122' pins 'en-US' as an invalid variant"
    - path: test/extension/runtime-contract.test.js
      issue: "':261' pins the exact-match behaviour"
  missing:
    - "Compare the primary language subtag (case-insensitive) instead of the full tag"
    - "Widen the CSS to [lang|=\"en\" i] so paint follows the diagnosis"
    - "Invert the three tests that currently assert en-US is unsupported"
  verified_by_orchestrator: "Confirmed independently: content.js:64 and zhroma.css lang selectors read as reported; en-US appears in invalidVariants in both tint suites."

- gap_id: G-04-22b
  truth: "The worker's staleness and serialization machinery is actually held by the test suite"
  status: failed
  reason: "Independent review WR-01/WR-02/WR-06, mutation-proven: removing EVERY generation guard (generationOf down to zero call sites) AND the per-tab serialization queue still passed 277/277 behavioural tests — only the SHA byte-pin objected. Root cause: tracer-world.js:142-157 delays delivery rather than the response, so a stale payload cannot be constructed. 17 of 43 mutants survived overall; lastError branches, the reply-shape/TITLES pairing gate, serializePreference and onRemoved cleanup all survive deletion. The 04-VALIDATION.md tripwire is one-directional: it catches ADDING a wrong guard but not REMOVING the right one."
  severity: major
  test: 22
  artifacts:
    - path: test/extension/tracer-world.js
      issue: ":142-157 delays delivery, not the response, so no test can construct a stale reply"
    - path: extension/background.js
      issue: "staleness + serialization behaviour is unpinned by any behavioural assertion"
  missing:
    - "Make the harness able to delay a RESPONSE so a genuinely stale reply is constructible"
    - "Add assertions that fail when a generation guard or the serialization queue is removed"
    - "Cover lastError branches, the {diagnosis, reason} pairing gate and onRemoved cleanup"

## Current-build walkthrough — 2026-09-11

User response to preparation checkpoint: "numbers are the same as before, let's do it". The referenced prior environment is Chrome 152, macOS 27 beta 6, 30 mounted rows. This confirms unchanged environment numbers and willingness to start; it does not yet provide an explicit loaded-source confirmation, ACK-04-01, or a current-build check outcome. Canonical live slots remain pending until those observations arrive.

### Working state and source confirmation — pass

2026-09-11: Asked the user to check priority colours, check artwork, matching "Priority tinting is working" title/popup, and to confirm loading the repaired build and acknowledge that fourteen earlier observations apply only to the old build. User response: "pass". Record working-icon as pass, source confirmed, and ACK-04-01 acknowledged; no other check is inferred. Next: blank-copy.

### Blank priorities — pass

2026-09-11: User replied "pass" to blank-copy: check artwork remains and the popup reads "Priority column found. These tickets have no priority values set". No other check is inferred. Next: missing-icon-hint.

### Missing Priority column — pass

2026-09-11: User replied "pass" to missing-icon-hint: column-plus toolbar artwork, the add-a-Priority-column popup hint, and no hint/banner/badge inside Zendesk. No transition observation is inferred. Next: missing-settle-transition.

### Missing-column loading transition — pass

2026-09-11: User replied "pass" to missing-settle-transition: neutral hollow circle during loading, followed by column-plus after settling, with no premature missing-column indication. Next: off-clears. Existing language/structure waivers remain unchanged; regional-English testing remains pending.

### Off switch — pass

2026-09-11: User replied "pass" to off-clears: tint disappears immediately without refresh, popup says "Tinting is off", toolbar shows the power symbol, and OFF is not presented as an error or accompanied by pressure to re-enable. This is the user's current-source no-pressure observation for this path. Next: on-restores.

### On switch restores tint — pass

2026-09-11: User replied "pass" to on-restores: tint returns immediately without refresh and matches currently displayed priorities. Next: restart-off.

### Restart with tinting off — pass

2026-09-11: User replied "pass" to restart-off: after a full Chrome quit and reopen, OFF persists, the view remains untinted and the power-symbol artwork remains. Next: restart-on.

### Restart with tinting on — pass

2026-09-11: User replied "pass" to restart-on: after a full Chrome quit and reopen, ON persists and priority tinting returns. Next: cross-tab-preference.

### Cross-tab preference — pass

2026-09-11: User replied "pass" to cross-tab-preference: both tabs follow OFF and ON while each retains the diagnosis of its own view. Next: frozen-resume.

### Frozen/discarded tab resumes — pass

2026-09-11: User replied "pass" to frozen-resume, explicitly framed around an actually frozen/discarded tab: after OFF elsewhere, the tab resumes untinted without restoring stale ON state. Next: nonreceiver-status.

### 2026-09-11 current-build observation: nonreceiver-status

- Result: pass.
- Evidence: User replied "pass" after turning tinting on, opening a new tab or non-Zendesk page, and checking that the popup showed "No readable view is connected" without an invented diagnosis about that page.

### 2026-09-11 current-build observation: navigation-status

- Result: pass.
- Evidence: User replied "pass" after moving from a tinted Zendesk view to a non-view surface and back with the popup closed; icon and popup state tracked the current document, and the prior working state did not carry onto the non-view page.
