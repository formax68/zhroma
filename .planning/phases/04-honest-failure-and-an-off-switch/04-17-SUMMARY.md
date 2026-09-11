---
phase: 04-honest-failure-and-an-off-switch
plan: "17"
subsystem: extension-runtime
tags: [locale, chrome, css, diagnosis, tdd]
status: complete
requires:
  - phase: 04-14
    provides: Current finite preference/status protocol
provides:
  - Truthful structural refusal for malformed English metadata
  - Nonempty exact four-rule CSS source guard
  - Independent real-Chrome synthetic selector and paint matrix
affects: [04-18, 04-19, 04-20]
tech-stack:
  added: []
  patterns: [reason-only locale normalization, isolated synthetic Chrome verification]
key-files:
  created:
    - scripts/verify-locale-rendering.js
    - test/extension/locale-rendering.test.js
    - .planning/phases/04-honest-failure-and-an-off-switch/04-17-CHROME-EVIDENCE.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-17-red-adapter.mjs
    - .planning/phases/04-honest-failure-and-an-off-switch/04-17-task1-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-17-task2-RED.json
  modified:
    - extension/content.js
    - test/extension/diagnosis.test.js
    - test/extension/runtime-contract.test.js
key-decisions:
  - Raw painting predicate remains unchanged; normalization selects refusal reason only.
  - Synthetic Chrome results do not satisfy live-tenant acceptance or waived slots.
requirements-addressed: [FAIL-01, FAIL-02, FAIL-03, FAIL-05]
requirements-completed: []
plan_head_before: 9cb3d187eac3b01642df004112d806a4b88363a5
actuals:
  tokens: 28463
  tasks: 2
  commits: 5
duration: approximately 15min
completed: 2026-09-11
coverage:
  - id: locale-refusal
    description: Malformed English metadata yields structure copy and no tint through shipped content, worker and popup
    verification:
      - kind: integration
        ref: test/extension/diagnosis.test.js
        status: pass
    human_judgment: false
  - id: locale-rendering
    description: Sixteen locale cases checked with actual Chrome selectors and computed backgrounds
    verification:
      - kind: automated_ui
        ref: .planning/phases/04-honest-failure-and-an-off-switch/04-17-CHROME-EVIDENCE.json
        status: pass
    human_judgment: false
---

# Phase 4 Plan 17: Truthful Locale Refusal and Chrome Rendering Summary

**Malformed English shells remain untinted and receive structural-unreadability copy; an isolated Chrome run verifies all 16 supported/refused cases independently of happy-dom.**

## Accomplishments

- Preserved the raw, untrimmed painting predicate. Inside its refusal branch only, trim/lowercase/underscore normalization recognizes English metadata without enabling tint or changing `lang`.
- Four separately named tests carry `[locale:malformed-english-reason]` assertions across actual content, worker and popup scripts, fixed unreadable icon/title, emitted finite status, and zero markers.
- CSS text extraction requires exactly four rules and exact `html[lang|="en" i] ` heads, direct-cell endings and important declarations. Existing palette/direct-cell semantic checks remain. `[locale:selector-family]` assertions are independently targetable by 04-18.
- Added a Node-built-in-only Chrome CLI with isolated temporary profile, loopback-only server/CDP, restrictive synthetic-document CSP, owned process/socket/server cleanup, finite timeouts and nonzero failures. It reads the admitted fixture and shipped bytes without modifying runtime assets.
- Browser snapshots measure actual-source marker count, finite diagnosis and computed palette first. A separate CSS-only known-marker probe then measures all four selector matches and painted cells, so absence of runtime markers cannot conceal incorrect CSS language matching.

## Task Commits

1. Task 1 RED: `ce34e72` — reproduce malformed English refusal across shipped surfaces.
2. Task 1 GREEN: `6b2e233` — classify malformed English metadata as structural unreadability.
3. Task 2 RED: `51434b4` — reject incomplete locale rendering evidence.
4. Task 2 GREEN: `9897a78` — verify locale selectors and paint in isolated Chrome.

Measured `actuals.commits: 5` is the persisted ledger's `git rev-list --count 9cb3d187eac3b01642df004112d806a4b88363a5..9897a78352aea2c659033c7b1ba576121792644a` result. It includes concurrent parent docs commit `212b6c8` for 04-15; only the four commits listed above belong to this plan. Tokens are `ceil(realized diff characters / 4)` across the nine plan-owned files before SUMMARY, including persisted evidence; no harness token count is used.

## Verification

- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/diagnosis.test.js test/extension/runtime-contract.test.js`: 54/54 passed; tracer feedback rerun also 54/54.
- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/locale-rendering.test.js`: 27/27 passed.
- Combined final run of all three files: 81/81 passed, 3/3 files, exit 0.
- `node scripts/verify-locale-rendering.js --smoke`: `LOCALE RENDERING: passed`, exit 0, Chrome/153.0.8010.37, 16/16 cases, measured **2205.717292 ms** including process completion. Recorded at `2026-09-11T07:03:55.740Z` with source/CSS/harness SHA-256 hashes in `04-17-CHROME-EVIDENCE.json`.
- `git diff --check`: passed. No generated profile/server/browser remains owned by this run.
- Unit checks reject empty/incomplete/duplicate/malformed results, nonfinite fields, extra page data, absent browser/version/source, invalid flags, startup timeout/exit/malformed endpoint, CDP timeout and nonlocal endpoint. CLI subprocess confirms missing Chrome exits 1 with no pass line. These are unit checks, not browser execution claims.

## Complete Observed Chrome Matrix

`[16,16,16,16]` means 16 direct cells for each Urgent/High/Normal/Low rule. The source palette counts were also `[16,16,16,16]` for every accepted case and `[0,0,0,0]` for every refused case.

| Raw lang | CSS-only selector matches | CSS-only painted cells | Source markers | Source painted cells | Source diagnosis | Reason |
|---|---|---:|---:|---:|---|---|
| `en` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `EN` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `en-GB` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `en-US` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `EN-gb` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `en-Latn-GB` | [16,16,16,16] | 64 | 4 | 64 | working | null |
| `fr` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | unsupported-language |
| `fr-CA` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | unsupported-language |
| `de` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | unsupported-language |
| empty string | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| one space | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| ` en` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| `en ` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| ` en-GB ` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| `en_US` | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |
| absent attribute (`null`) | [0,0,0,0] | 0 | 0 | 0 | cannot-read | structure |

The right-padded `en ` case confirms the documented happy-dom mismatch: its secondary selector model accepts that value; Chrome rejects it. The optional ASCII `i` flag is retained as the accepted defensive source convention; removing it is not claimed to change Chrome behavior.

## TDD Gate Compliance

- Task 1: before production changes, four intended popup-copy assertions failed, 50 other tests passed. Expected structural copy; actual unsupported-language copy. `04-17-task1-RED.json` validated `RED_EVIDENCE_OK` before GREEN; source fix yielded 54/54.
- Task 2: API scaffold intentionally accepted empty evidence and omitted required behavior; the named empty-evidence assertion failed, alongside 19 other contract assertions, with one complete-matrix scaffold assertion passing. `04-17-task2-RED.json` validated `RED_EVIDENCE_OK` before implementation. Final implementation passes 27/27.
- RED commits precede GREEN commits for both tasks. No refactor-only commit was needed. RED-stage scaffolds are fully replaced.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Blocking] RED validator accepts node TAP only.** Native Vitest TAP has nested cases without node summary counters and initially classified as `INVALID_RED`. Added a transparent plan-local adapter that reads the real Vitest JSON assertion results and asserts those statuses with node:test. It preserves original failure messages and records the complete emitted TAP. Both records then passed the actual GSD validator; no failure was invented. Files: `04-17-red-adapter.mjs`, both RED records. Commit: `ce34e72` (adapter/Task 1), `51434b4` (Task 2 evidence).
2. **[Rule 1 - Bug] Synthetic snapshot raced the preference read.** First actual browser attempt failed closed at case 8 (`fr-CA`): taking the CSS-only probe while diagnosis was still neutral suspended the document prematurely. Snapshot now waits for the finite resolved diagnosis before touching the synthetic DOM. Subsequent full Chrome run and measured final-byte run passed. File: `scripts/verify-locale-rendering.js`. Commit: `9897a78`.

## Issues Encountered

- Mandatory executor guard rejected protected `main`. Parent moved the shared checkout to `codex/phase04-gap-closure` before the first task commit, preserving pre-existing changes. All plan commits are on that branch.
- Sandbox denied a loopback `listen` attempt. Authorized escalation allowed the isolated synthetic browser run. No package installation, authenticated tab, or operational Zendesk view was used.

## Acceptance and Handoff

These results are **real-Chrome synthetic rendering evidence**. They do not satisfy the `english-regional-locale` live-tenant slot, any AR-04-01 waived slot, or the final 04-20 walkthrough. No LIVE-ACCEPTANCE file, historical observation, requirement completion, or Phase 3 status was promoted. The current-source acceptance binding remains stale until 04-20. No whole-suite green claim is made.

04-18 can target the stable malformed-English and selector-family assertions; 04-19/04-20 still own the remaining security and attributed human acceptance gates. Shared STATE/ROADMAP/REQUIREMENTS updates belong to the orchestrator by the explicit execution assignment and were not edited by this executor.

## Self-Check: PASSED

All nine plan-owned source/test/evidence files exist; all four task commits are present. The final focused tests and Chrome matrix passed. No unresolved implementation stubs or skipped plan verification remain.
