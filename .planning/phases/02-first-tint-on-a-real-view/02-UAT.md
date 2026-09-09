---
status: diagnosed
phase: 02-first-tint-on-a-real-view
source: [02-VERIFICATION.md]
started: 2026-09-08T12:52:50Z
updated: 2026-09-09T07:58:21.633Z
---

# Phase 02 User Acceptance

Implementation and review preparation are complete; phase acceptance remains open with initial-load gap G-02-1. The eleven authentic product checks are separate from the six unspecified-edge decisions and six prohibition judgments. No item has been implicitly passed.

Load `/Users/mike/code/zhroma/extension` using Chrome’s Load unpacked control, reload the extension, then fully reload an approved English light-interface Zendesk view. The user owns login, navigation and native interactions. Record non-identifying observations against the hashes in 02-LIVE-ACCEPTANCE.md; unavailable states remain pending.

## Current Test

[testing complete — 10 live checks passed, 12 decisions accepted, 1 initial-load issue open]

## Tests

### 1. initial-load
test: Load the repository extension folder, reload the extension, then fully reload an approved English current Agent Workspace view in the light interface with no product configuration. Observe the complete initial table and any naturally occurring delayed batches.
expected: Every recognized initial ticket row receives its correct tint; blank priorities remain untinted and unsafe tables are refused. Record observed startup completeness, whether delayed batches occurred or were missed, and the measured 15000 ms deadline/100 ms quiet interval. Do not claim unobserved delayed batches were tested.
why_human: A1 is a heuristic. Offline timing tests do not establish when a real Zendesk initial load is semantically complete.
result: issue
reported: "approved. When I opened the agent view it didn't load, I had to reload the page"
clarification: "both and it doesn't work until I reload. you can check yourself if you want"
severity: major
observed: On 2026-09-09, read-only browser inspection found 30 current rows and zero tint markers. After full reload, 22 Normal rows had markers and eight blank-priority rows remained unmarked. One fresh-tab navigation to the same view succeeded with the same counts and the expected Normal cell background. The user-reported fresh-tab failure was not reproduced in that attempt; original tab entry history and failure mechanism remain unconfirmed. Current repository hashes match the acceptance inventory; the user subsequently confirmed the loaded directory and reload at check 11.

### 2. urgent
test: Inspect an existing authentic Urgent row alongside the other priorities against the final loaded source.
expected: Soft red is distinct and readable at a glance, with the strongest emphasis; treatment remains pale/translucent.
why_human: CSS values and selector matching do not prove perceptual distinction or live legibility.
result: pass
reported: "Urgent works fine. when I click on next page to find more tickets, the gradient goes away"
source: user
scope_note: User accepts the Urgent appearance check. Source identity is now confirmed by check 11 and the repository hash check. The separate pagination observation is retained below for Phase 3.

### 3. high
test: Inspect an existing authentic High row alongside the other priorities.
expected: Soft orange is distinct and readable, less emphatic than Urgent and more emphatic than Normal/Low.
why_human: Actual color distinction and emphasis need authentic rendering.
result: pass
reported: "passed"
source: user
scope_note: User accepts High appearance; source identity is now confirmed by check 11 and the repository hash check.

### 4. normal
test: Inspect an existing authentic Normal row.
expected: Soft yellow remains distinct, readable and quieter than Urgent/High.
why_human: Actual color distinction and readability need authentic rendering.
result: pass
reported: "pass"
source: user
scope_note: User accepts Normal appearance; source identity is now confirmed by check 11 and the repository hash check.

### 5. low
test: Inspect an existing authentic Low row.
expected: Soft green remains distinct, readable and quieter than Urgent/High.
why_human: Actual color distinction and readability need authentic rendering.
result: pass
reported: "pass"
source: user
scope_note: User accepts Low appearance; source identity is now confirmed by check 11 and the repository hash check.

### 6. native-hover
test: Compare a genuine hovered ticket row with its normal state and an unmodified baseline, using the final loaded extension.
expected: Hover remains clearly distinguishable, priority tint remains visible, and text remains readable.
why_human: Unchanged host properties do not establish that the live cascade/compositing preserves the visual state.
result: pass
reported: "pass"
source: user
scope_note: User accepts hover appearance and baseline comparison; source identity is now confirmed by check 11 and the repository hash check.

### 7. native-selection-inset
test: Select a row using the user's approved native control and compare with the unmodified baseline; do not execute a bulk action.
expected: Selection remains clearly distinguishable with tint retained; the first-cell native inset stays visible.
why_human: The native visual state requires authentic observation; this also supplies evidence for P-02-02/T-02-05.
result: pass
reported: "pass"
source: user
scope_note: User accepts native selection, retained tint, left-edge indicator and baseline comparison; source identity is now confirmed by check 11 and the repository hash check.

### 8. unread-bold
test: Inspect an existing authentic unread/bold row without changing tickets to manufacture the state.
expected: Unread/bold emphasis remains visible and text remains readable over the tint.
why_human: The DOM preservation regression does not render the authentic host typography/cascade.
result: pass
reported: "pass"
source: user
scope_note: User accepts existing unread/bold emphasis and legibility; source identity is now confirmed by check 11 and the repository hash check.

### 9. focus-click
test: Use approved safe native focus/click controls and compare behavior with the unmodified baseline; leave unavailable safe coverage pending.
expected: Ordinary focus and click behavior is unchanged. Do not open/change tickets solely to create coverage.
why_human: The fixture's synthetic listener proves structural preservation, not the real user's complete interaction.
result: pass
reported: "pass"
source: user
scope_note: User accepts keyboard focus, safe checkbox clicks and baseline comparison; source identity is now confirmed by check 11 and the repository hash check.

### 10. reordered-reload
test: In a user-owned disposable view, safely move the Priority header and associated cells, then perform a full page reload. Leave this pending if safe reconfiguration is unavailable.
expected: Tint mapping follows the new header position after reload, with no guessed fixed position. This does not test Phase 3 automatic reapplication.
why_human: Synthetic relocation proves the indexing algorithm, but the real supported-view outcome remains unobserved.
result: pass
reported: "pass"
source: user
scope_note: User accepts correct priority mapping after safe column reordering and full reload; source identity is now confirmed by check 11 and the repository hash check.

### 11. source-identity
test: Confirm Chrome loaded and reloaded this repository's extension/ folder; have the reviewer recompute all three recorded SHA-256 hashes before accepting final-source observations.
expected: The actual loaded manifest.json, content.js and zhroma.css correspond to the current repository bytes; all observations name those final bytes.
why_human: Repository hashes alone cannot establish the directory loaded by Chrome; the user must confirm the directory and reload.
result: pass
reported: "pass"
source: user and repository SHA-256 verification
observed: User confirms the repository extension folder and reload were used throughout the reported checks. All three asset hashes match the acceptance inventory.

### 12. decision-E01
test: Review E01 (DETECT-01/unclassified) against the header-order requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E01 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "accepted"
source: user decision
disposition: E01 closed by explicit scope decision, with no additional behaviour required beyond finding Priority by its header. DETECT-01 remains binding. This is not evidence that an unspecified edge case was tested, nor a waiver of the initial-load gap.
decided_on: 2026-09-09

### 13. decision-E12
test: Review E12 (TINT-03/unclassified) against the native-state preservation requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E12 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "approved"
source: user decision
disposition: E12 closed by explicit scope decision, with no additional behaviour required beyond preserving native hover, selection, unread emphasis and keyboard/click states. TINT-03 remains binding. No unnamed edge test or broader interaction coverage is claimed; G-02-1 remains open.
decided_on: 2026-09-09

### 14. decision-E13
test: Review E13 (TINT-04/unclassified) against the translucent composition requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E13 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "approved"
source: user decision
disposition: E13 closed by explicit scope decision, with no additional behaviour beyond pale, translucent tints preserving readability and native row states in the supported light interface. TINT-04 remains binding. No unnamed edge test or broader theme coverage is claimed; G-02-1 remains open.
decided_on: 2026-09-09

### 15. decision-E17
test: Review E17 (CTRL-01/unclassified) against the no-setup initial-load requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E17 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "approved"
source: user decision
disposition: E17 closed by explicit scope decision as adding no separate requirement beyond first-load tinting without product configuration. CTRL-01 remains binding. The reported second-reload problem remains open under G-02-1 for diagnosis and retesting; this approval is not startup acceptance or risk acceptance for that defect.
decided_on: 2026-09-09

### 16. decision-E19
test: Review E19 (STORE-03/unclassified) against the exact content-script match requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E19 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "approved"
source: user decision
disposition: E19 closed by explicit scope decision, with no additional URL-matching behaviour beyond exactly https://*.zendesk.com/agent/*. STORE-03 remains binding. No permission expansion, additional supported site, or unnamed edge-test execution is implied.
decided_on: 2026-09-09

### 17. decision-E20
test: Review E20 (STORE-05/unclassified) against the authored/loaded-source identity requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E20 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: pass
reported: "approved"
source: user decision
disposition: E20 closed by explicit scope decision, with no additional behaviour beyond the authored/loaded-source identity requirement. STORE-05 remains binding; directory/reload confirmation and three matching repository hashes supply current evidence. Future asset edits retain the existing invalidation, reload and retesting rules. No unnamed edge test is claimed.
decided_on: 2026-09-09

### 18. decision-P-02-01
test: Review P-02-01: MUST NOT infer a ticket priority from column position, other fields, icons, substrings, or blank cells. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "approved"
source: user evidence judgment
disposition: User accepts that the reviewed implementation satisfies P-02-01: Priority is found by its header, exact English labels are read only from that column, blanks remain untinted and unknown labels refuse the table. Source review and observed column-reordering/blank-row behavior support the judgment. The prohibition remains binding; this is neither a waiver nor exhaustive live coverage. G-02-1 remains open.
decided_on: 2026-09-09

### 19. decision-P-02-02
test: Review P-02-02: MUST NOT replace Zendesk native interaction paint or add attention devices beyond the four translucent full-row priority tints. Read its independent source judgment below (partly-supported; native appearance uncertain) and explicitly resolve this individual judgment item.
expected: Resolve only after the authentic native-state evidence supports the prohibition, or record an explicit scoped decision without inventing observations.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "approved"
source: user evidence judgment
disposition: User accepts P-02-02 as satisfied for the reviewed source and tested light-interface views. Four alpha cell-background rules and owned priority markers add no badges, stripes or animations; accepted hover, selection/inset, unread and focus/click checks supply authentic native-state evidence. The prohibition remains binding; untested states and broader themes are not claimed. G-02-1 remains open.
decided_on: 2026-09-09

### 20. decision-P-02-03
test: Review P-02-03: MUST NOT turn zero-setup tinting into ticket collection, storage, telemetry, network access, or an expanded permission surface. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "accepted"
source: user evidence judgment
disposition: User accepts P-02-03 as satisfied by the reviewed implementation: local DOM processing, no ticket collection, persistence, telemetry or network calls, unused existing storage permission and no expanded permission surface. The prohibition remains binding. This does not grant new access, accept unresolved security threats or replace the separate security review. G-02-1 remains open.
decided_on: 2026-09-09

### 21. decision-P-02-04
test: Review P-02-04: MUST NOT claim broader locale, shell, or account-plan support from the English current Workspace evidence. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "approved"
source: user evidence judgment
disposition: User accepts P-02-04 with compatibility claims limited to the tested English current Agent Workspace views in the light interface. No broader language, legacy interface or untested account-plan support is established by these observations or the wildcard URL match. The prohibition remains binding; G-02-1 remains open.
decided_on: 2026-09-09

### 22. decision-P-02-05
test: Review P-02-05: MUST NOT present fixture tests, pending visual rows, or stale asset hashes as real-view product acceptance. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "approved"
source: user evidence judgment
disposition: User accepts the current evidence record as accurate: ten source-bound live passes, one unresolved initial-load failure, and product acceptance gaps_found. Fixture tests remain separate from live observations; the evidence validator passes without converting G-02-1 into acceptance. Source-change invalidation and retesting rules remain binding. This is no waiver of the startup issue.
decided_on: 2026-09-09

### 23. decision-P-02-06
test: Review P-02-06: MUST NOT rewrite repository-byte re-admission as a fresh capture or historical approval independence as attested. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: pass
reported: "approve"
source: user evidence judgment
disposition: User accepts the record with existing fixtures retained as previously approved repository copies, not fresh captures, and AR-01-13 retained as a historical exception with original package-approval independence still not-attested. Today's live checks establish no missing historical fact; no new exception or waiver of G-02-1 is granted.
decided_on: 2026-09-09

## Summary

total: 23
passed: 22
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-1
  truth: "A fresh supported agent-view page load tints recognized priority rows without a second manual reload."
  status: failed
  reason: >-
    User reported: "both and it doesn't work until I reload. you can check yourself if you want".
    The existing untinted table recovered after reload; one independent fresh-tab attempt succeeded.
    Keep the reported fresh-load failure open pending diagnosis.
  severity: major
  test: 1
  root_cause: "Investigation inconclusive: terminal refusal, success followed by replacement, and deadline expiry reproduce missing-tint mechanisms in synthetic exact-byte probes, but the failing fresh startup was not observed in flight. No live root cause is confirmed. See the debug record and the blocking reproduction gate in 02-03."
  diagnosis_status: inconclusive
  debug_session: .planning/debug/02-initial-load-requires-reload.md
  fix_plan: 02-03
  artifacts:
    - path: "extension/content.js"
      issue: "Investigate initial startup readiness, terminal preflight and source injection against a reproducible fresh-load failure."
  missing:
    - "Reproduce the reported fresh-load failure against the confirmed source bytes with sanitized timing evidence."
    - "Derive a failing regression from the confirmed cause before changing runtime behavior."

## Deferred Follow-Ups

- test: 2
  idea: "when I click on next page to find more tickets, the gradient goes away"
  deferred_at: 2026-09-09
  target_phase: 03-the-tint-survives-everything
  disposition: "Record explicit Next/Previous pagination coverage during Phase 3 planning. This is replacement of rows after the initial tint attempt, consistent with the existing Phase 2 finite-startup boundary. Pagination is not yet explicitly enumerated in the roadmap's liveness criteria; this observation must not be lost under generic view-switch coverage. It does not resolve G-02-1."
