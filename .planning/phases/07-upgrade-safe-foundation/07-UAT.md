---
status: testing
phase: 07-upgrade-safe-foundation
source: [07-VERIFICATION.md]
started: 2026-09-28T12:00:00Z
updated: 2026-09-28T12:00:00Z
---

## Current Test

number: 1
name: Decide WR-02 — popup switch-on while the settings read has not settled
expected: |
  0.1.0 answers `applied: true, diagnosis: working` and the popup shows "Priority tinting is working".
  The Phase 7 bytes answer `applied: true, diagnosis: neutral`; the open popup shows "Checking this view"
  and does not update; rows tint only when the 500 ms gate opens (the toolbar then self-corrects and a
  freshly opened popup shows working). Either accept this as the cost of D-09's bounded wait, or apply the
  reviewer's fix (`&& (!preferenceEnabled || settingsReady)` in applyPreference, plus a hang-mode
  handshake test) before Phase 8 edits content.js.
awaiting: user response

## Tests

### 1. Decide WR-02 — popup switch-on while the settings read has not settled
expected: 0.1.0 answers `applied: true, diagnosis: working` immediately. The Phase 7 bytes answer `applied: true, diagnosis: neutral` until the 500 ms settings gate opens; the open popup shows "Checking this view" and does not update. Accept as the cost of D-09's bounded wait, or apply the reviewer's one-line fix plus a hang-mode handshake test before Phase 8.
result: [pending]

### 2. Confirm D-29's same-session band replaces SC 4's literal "about 1.3 ms"
expected: 07-CONTEXT.md D-29 records the replacement; the recomputed same-session 30-row medians are 1.7 ms (Phase 7) vs 1.8 ms (0.1.0), band 0.2 ms, passed. Either add an override for SC 4's wording or update the ROADMAP text.
result: [pending]

### 3. Resolve the 11 judgment-tier prohibitions (plan frontmatter, all `flagged: true`)
expected: Verifier's non-authoritative verdicts in 07-VERIFICATION.md: 9 hold on the evidence; 1 is human-attestation only (07-02 approval before install); 1 is partly contradicted in the fault window (07-06 COMPAT-04, see WR-02).
result: [pending]

### 4. Decide WR-01 and WR-06 — guards sound today but evadable later
expected: WR-01 — commit 2441c64 narrowed scripts/phase-04-source.js from a whole-file pin to judge-text slices; today's runner has no top-level code altering the judges, but a later edit could. WR-06 — frozen-contract patterns miss `fetch.call`, scheme-relative URLs and aliased `chrome.storage`; shipped code has none today. Because the frozen file is never to be edited, tightening must happen now or be explicitly waived.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
