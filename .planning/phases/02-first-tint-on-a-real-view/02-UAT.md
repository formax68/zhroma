---
status: testing
phase: 02-first-tint-on-a-real-view
source: [02-VERIFICATION.md]
started: 2026-09-08T12:52:50Z
updated: 2026-09-08T12:52:50Z
---

# Phase 02 User Acceptance

Implementation and review are complete; phase acceptance remains human_needed. The eleven authentic product checks are separate from the six unspecified-edge decisions and six prohibition judgments. No item has been implicitly passed.

Load `/Users/mike/code/zhroma/extension` using Chrome’s Load unpacked control, reload the extension, then fully reload an approved English light-interface Zendesk view. The user owns login, navigation and native interactions. Record non-identifying observations against the hashes in 02-LIVE-ACCEPTANCE.md; unavailable states remain pending.

## Current Test

number: 1
name: initial-load
expected: |
  Every recognized initial ticket row receives its correct tint; blank priorities remain untinted and unsafe tables are refused. Record observed startup completeness, whether delayed batches occurred or were missed, and the measured 15000 ms deadline/100 ms quiet interval. Do not claim unobserved delayed batches were tested.
awaiting: user response

## Tests

### 1. initial-load
test: Load the repository extension folder, reload the extension, then fully reload an approved English current Agent Workspace view in the light interface with no product configuration. Observe the complete initial table and any naturally occurring delayed batches.
expected: Every recognized initial ticket row receives its correct tint; blank priorities remain untinted and unsafe tables are refused. Record observed startup completeness, whether delayed batches occurred or were missed, and the measured 15000 ms deadline/100 ms quiet interval. Do not claim unobserved delayed batches were tested.
why_human: A1 is a heuristic. Offline timing tests do not establish when a real Zendesk initial load is semantically complete.
result: [pending]

### 2. urgent
test: Inspect an existing authentic Urgent row alongside the other priorities against the final loaded source.
expected: Soft red is distinct and readable at a glance, with the strongest emphasis; treatment remains pale/translucent.
why_human: CSS values and selector matching do not prove perceptual distinction or live legibility.
result: [pending]

### 3. high
test: Inspect an existing authentic High row alongside the other priorities.
expected: Soft orange is distinct and readable, less emphatic than Urgent and more emphatic than Normal/Low.
why_human: Actual color distinction and emphasis need authentic rendering.
result: [pending]

### 4. normal
test: Inspect an existing authentic Normal row.
expected: Soft yellow remains distinct, readable and quieter than Urgent/High.
why_human: Actual color distinction and readability need authentic rendering.
result: [pending]

### 5. low
test: Inspect an existing authentic Low row.
expected: Soft green remains distinct, readable and quieter than Urgent/High.
why_human: Actual color distinction and readability need authentic rendering.
result: [pending]

### 6. native-hover
test: Compare a genuine hovered ticket row with its normal state and an unmodified baseline, using the final loaded extension.
expected: Hover remains clearly distinguishable, priority tint remains visible, and text remains readable.
why_human: Unchanged host properties do not establish that the live cascade/compositing preserves the visual state.
result: [pending]

### 7. native-selection-inset
test: Select a row using the user's approved native control and compare with the unmodified baseline; do not execute a bulk action.
expected: Selection remains clearly distinguishable with tint retained; the first-cell native inset stays visible.
why_human: The native visual state requires authentic observation; this also supplies evidence for P-02-02/T-02-05.
result: [pending]

### 8. unread-bold
test: Inspect an existing authentic unread/bold row without changing tickets to manufacture the state.
expected: Unread/bold emphasis remains visible and text remains readable over the tint.
why_human: The DOM preservation regression does not render the authentic host typography/cascade.
result: [pending]

### 9. focus-click
test: Use approved safe native focus/click controls and compare behavior with the unmodified baseline; leave unavailable safe coverage pending.
expected: Ordinary focus and click behavior is unchanged. Do not open/change tickets solely to create coverage.
why_human: The fixture's synthetic listener proves structural preservation, not the real user's complete interaction.
result: [pending]

### 10. reordered-reload
test: In a user-owned disposable view, safely move the Priority header and associated cells, then perform a full page reload. Leave this pending if safe reconfiguration is unavailable.
expected: Tint mapping follows the new header position after reload, with no guessed fixed position. This does not test Phase 3 automatic reapplication.
why_human: Synthetic relocation proves the indexing algorithm, but the real supported-view outcome remains unobserved.
result: [pending]

### 11. source-identity
test: Confirm Chrome loaded and reloaded this repository's extension/ folder; have the reviewer recompute all three recorded SHA-256 hashes before accepting final-source observations.
expected: The actual loaded manifest.json, content.js and zhroma.css correspond to the current repository bytes; all observations name those final bytes.
why_human: Current repository hashes are proven, but loaded_from_repository is false and no loaded-directory confirmation exists.
result: [pending]

### 12. decision-E01
test: Review E01 (DETECT-01/unclassified) against the header-order requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E01 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 13. decision-E12
test: Review E12 (TINT-03/unclassified) against the native-state preservation requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E12 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 14. decision-E13
test: Review E13 (TINT-04/unclassified) against the translucent composition requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E13 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 15. decision-E17
test: Review E17 (CTRL-01/unclassified) against the no-setup initial-load requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E17 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 16. decision-E19
test: Review E19 (STORE-03/unclassified) against the exact content-script match requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E19 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 17. decision-E20
test: Review E20 (STORE-05/unclassified) against the authored/loaded-source identity requirement; specify the missing edge predicate or record an explicit item-specific decision.
expected: E20 receives an auditable disposition. A related passing requirement test or Phase 1 acceptance must not silently dismiss this unspecified probe.
why_human: The supplied taxonomy establishes no additional testable predicate. Source review cannot infer the intended edge or manufacture a check descriptor.
result: [pending]

### 18. decision-P-02-01
test: Review P-02-01: MUST NOT infer a ticket priority from column position, other fields, icons, substrings, or blank cells. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

### 19. decision-P-02-02
test: Review P-02-02: MUST NOT replace Zendesk native interaction paint or add attention devices beyond the four translucent full-row priority tints. Read its independent source judgment below (partly-supported; native appearance uncertain) and explicitly resolve this individual judgment item.
expected: Resolve only after the authentic native-state evidence supports the prohibition, or record an explicit scoped decision without inventing observations.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

### 20. decision-P-02-03
test: Review P-02-03: MUST NOT turn zero-setup tinting into ticket collection, storage, telemetry, network access, or an expanded permission surface. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

### 21. decision-P-02-04
test: Review P-02-04: MUST NOT claim broader locale, shell, or account-plan support from the English current Workspace evidence. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

### 22. decision-P-02-05
test: Review P-02-05: MUST NOT present fixture tests, pending visual rows, or stale asset hashes as real-view product acceptance. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

### 23. decision-P-02-06
test: Review P-02-06: MUST NOT rewrite repository-byte re-admission as a fresh capture or historical approval independence as attested. Read its independent source judgment below (source-supported) and explicitly resolve this individual judgment item.
expected: Record an explicit disposition against the current source/evidence scope; retain the stated evidence and historical limits.
why_human: This is a descriptor-less judgment-tier prohibition. The independent source judgment is NON-AUTHORITATIVE and is not a human acceptance or deterministic enforcement descriptor.
result: [pending]

## Summary

total: 23
passed: 0
issues: 0
pending: 23
skipped: 0
blocked: 0

## Gaps

None reported by the user. Missing observations and unresolved judgments are pending, not evidence of observed defects.
