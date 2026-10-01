---
status: complete
phase: 07-upgrade-safe-foundation
source: [07-VERIFICATION.md]
started: 2026-09-28T12:00:00Z
updated: 2026-10-01T16:45:23Z
---

## Current Test

[testing complete]

## Tests

### 1. Decide WR-02 — popup switch-on while the settings read has not settled
expected: 0.1.0 answers `applied: true, diagnosis: working` immediately. The Phase 7 bytes answer `applied: true, diagnosis: neutral` until the 500 ms settings gate opens; the open popup shows "Checking this view" and does not update. Accept as the cost of D-09's bounded wait, or apply the reviewer's one-line fix plus a hang-mode handshake test before Phase 8.
result: pass
decision: "A — accept. The fault-window divergence is recorded as a known cost of D-09's bounded wait; no fix before Phase 8. Options B (reviewer's applied:false one-liner) and C (defer the apply reply until the gate opens) were presented and declined."
decided_at: 2026-09-30

### 2. Confirm D-29's same-session band replaces SC 4's literal "about 1.3 ms"
expected: 07-CONTEXT.md D-29 records the replacement; the recomputed same-session 30-row medians are 1.7 ms (Phase 7) vs 1.8 ms (0.1.0), band 0.2 ms, passed. Either add an override for SC 4's wording or update the ROADMAP text.
result: pass
decision: "B — update the ROADMAP text. SC 4 in .planning/ROADMAP.md now states D-29's same-session rule (within 10% or 0.2 ms of the 0.1.0 bytes, same session and machine, existing budgets passing) in place of the machine-specific 'about 1.3 ms'. No override is added to 07-VERIFICATION.md."
decided_at: 2026-09-30

### 3. Resolve the 11 judgment-tier prohibitions (plan frontmatter, all `flagged: true`)
expected: Verifier's non-authoritative verdicts in 07-VERIFICATION.md: 9 hold on the evidence; 1 is human-attestation only (07-02 approval before install); 1 is partly contradicted in the fault window (07-06 COMPAT-04, see WR-02).
result: pass
decision: "A — confirm all. 9 verifier verdicts upheld. 07-02: the developer attests that typescript@7.0.2 and @types/chrome@0.3.0 were each approved as exact versions before installation (record and install share commit 2da0edf, so git cannot show the order). 07-06 COMPAT-04: accepted as a recorded exception confined to the 500 ms settings window — the WR-02 behaviour accepted in test 1. Note carried forward: the 07-04 'never writes an unchosen setting' verdict holds for `theme` only; WR-03 must be fixed before a normalising Phase 9/10 key lands."
decided_at: 2026-09-30

### 4. Decide WR-01 and WR-06 — guards sound today but evadable later
expected: WR-01 — commit 2441c64 narrowed scripts/phase-04-source.js from a whole-file pin to judge-text slices; today's runner has no top-level code altering the judges, but a later edit could. WR-06 — frozen-contract patterns miss `fetch.call`, scheme-relative URLs and aliased `chrome.storage`; shipped code has none today. Because the frozen file is never to be edited, tightening must happen now or be explicitly waived.
result: issue
reported: "A"
decision: "A — fix both now. One test-only gap-closure plan before Phase 8: run the pinned Phase 4 judges in a fresh VM context (WR-01) and tighten the frozen-contract network, scheme-relative and sync patterns with negative controls (WR-06). Uses D-31's single repair round. Options B (WR-06 only) and C (defer both) were presented and declined."
decided_at: 2026-10-01
severity: minor

## Summary

total: 4
passed: 3
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-07-4a
  truth: "The Phase 4 timing-judge guard cannot be bypassed by code outside the pinned judge slices: historical samples are judged by the pinned judge code itself, not by the working copy of scripts/run-tint-workload.js (WR-01)"
  status: failed
  reason: "User reported: A (fix WR-01 and WR-06 now, before Phase 8)"
  severity: minor
  test: 4
  artifacts: []
  missing: []

- gap_id: G-07-4b
  truth: "test/extension/frozen-contract.test.js catches evasive network calls (fetch.call, Reflect.apply, bracket access, aliasing), quoted scheme-relative URLs and aliased or destructured chrome.storage sync access, each proven by a negative control (WR-06)"
  status: failed
  reason: "User reported: A (fix WR-01 and WR-06 now, before Phase 8)"
  severity: minor
  test: 4
  artifacts: []
  missing: []
