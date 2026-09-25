---
phase: 06-live-dom-recon-2
plan: 02
subsystem: testing
tags: [recon-gate, ledger, run-sheet, node-test, privacy, dark-mode, identity]

# Dependency graph
requires:
  - phase: 06-live-dom-recon-2
    provides: "Plan 01: validateRecon2Fixtures / RECON2_SCENARIOS, the rule-columns sanitiser mode, RULE_STRUCTURAL_WORDS and the denylist-entry-collides rule"
  - phase: 01-dom-recon-spike
    provides: "Phase 1 ledger gate (verifyReconLedger, collectSections, parseFields), SELECTORS.md probes and the Execution Safety Note"
provides:
  - "verifyRecon2Ledger and RECON2_REQUIRED_IDS in scripts/verify-recon-gate.js, plus the `recon2 <ledger> <manifest>` CLI mode printing `RECON 2 VERDICT: proceed|block`"
  - "Registered but pending Recon 2 block in SELECTORS.md (handoff, eight entries, verdict) before Spec-less Planning Assumptions"
  - "06-RUN-SHEET.md: steps 0 to 8, 17 read-only one-line probes, the stash/copy capture projection and the recording map"
  - "D-26 Tags notes in ROADMAP.md (Phase 6 criterion 3) and REQUIREMENTS.md (RECON-06)"
affects: [06-03, phase-8, phase-9, phase-10]

# Actuals (#2632)
actuals:
  tokens: 30181
  tasks: 3
  commits: 4
plan_head_before: 4aa44a62cc0acf0f7239b26f91dae9e4ea92de0a

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Separate gate beside an untouched one: new `## Recon 2` heading prefixes, a separate exported function and CLI mode; verifyReconLedger is byte-identical"
    - "Fixed-order validation (placement, whole-block sensitive scan, registration, structured facts, derived verdict, fixture outcomes) so the first rejection is deterministic"
    - "Derived verdict: the recorded verdict must equal the one computed from the facts (D-24)"
    - "Run-sheet probes generated from readable sources, collapsed to one line, statically checked and smoke-run against a synthetic page in happy-dom before being spliced into the document"

key-files:
  created:
    - test/recon/recon2-gate.smoke.js
    - .planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md
  modified:
    - scripts/verify-recon-gate.js
    - SELECTORS.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "Structure versus rule codes: a closed-enum field with a value outside its set rejects recon-two-field-not-structured; a structurally valid value that breaks a rule (for example zhroma-off no, os-auto-used yes) rejects recon-two-fields-inconsistent"
  - "The Recon 2 block must be contiguous: a Recon 2 heading split from the block by any other heading rejects recon-two-block-misplaced, so no Recon 2 text escapes the sensitive scan"
  - "identity-source not-found requires a fallback naming Phase 10 on both identity entries (recon-two-fallback-missing otherwise)"
  - "Reused Phase 1 shape codes (entry-field-missing, entry-id-invalid, entry-heading-id-mismatch, entry-id-duplicate, admitted-scenarios-required) rather than minting recon-two twins"
  - "P2 marks candidate elements with data-zhroma-probe=identity-hit so repeated runs tell at-load, lazy and menu-only apart without returning any string; stash clears every probe marker on its clone before setting shape markers"

patterns-established:
  - "A Recon 2 fact enters the ledger only through a closed-enum field the gate checks; free-text shape summaries sit in dedicated non-empty fields"
  - "Run-sheet probes avoid sensitive-scan substrings in code (for example characterData: contains data:)"

requirements-completed: [RECON-04, RECON-05, RECON-06]

coverage:
  - id: D1
    description: "Recon 2 ledger gate: eight registered ids, closed-enum facts, D-24 derived verdict, D-23 fixture outcomes, D-26 Tags fallback, whole-block sensitive scan and placement, with every rejection code asserted"
    requirement: RECON-04
    verification:
      - kind: unit
        ref: "test/recon/recon2-gate.smoke.js (47 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "recon2 CLI mode: exact arity, value-free stderr, and RECON 2 VERDICT proceed/block against fixtures produced by the rule-columns sanitiser"
    requirement: RECON-06
    verification:
      - kind: integration
        ref: "test/recon/recon2-gate.smoke.js#prints the Recon 2 verdict for complete ledgers and rule-columns fixtures"
        status: pass
      - kind: integration
        ref: "test/recon/recon2-gate.smoke.js#rejects a pending scaffold and private words with value-free codes only"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 1 non-regression: final still proceeds with 18 entries, evidence still reports 18 terminal entries, verifyReconLedger source unchanged, SELECTORS.md tail from Spec-less Planning Assumptions byte-identical"
    requirement: RECON-04
    verification:
      - kind: unit
        ref: "test/recon/recon2-gate.smoke.js#the Phase 1 final gate is unchanged with a complete Recon 2 block in the real ledger"
        status: pass
      - kind: integration
        ref: "node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json -> FINAL VERDICT: proceed"
        status: pass
      - kind: integration
        ref: "test/recon/recon-gate.smoke.js (unchanged, all pass)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Registered pending Recon 2 block in SELECTORS.md; the real ledger rejects with exactly recon-two-status-unresolved, so the phase cannot close before the live session"
    requirement: RECON-05
    verification:
      - kind: integration
        ref: "test/recon/recon2-gate.smoke.js#the real ledger rejects with recon-two-status-unresolved while any Recon 2 status is pending"
        status: pass
      - kind: integration
        ref: "node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json -> RECON_GATE_REJECTED recon-two-status-unresolved"
        status: pass
    human_judgment: false
  - id: D5
    description: "06-RUN-SHEET.md: 17 probes and 2 projections present, single-line, side-effect free and sensitive-scan clean"
    requirement: RECON-04
    verification:
      - kind: other
        ref: "Task 3 static verify command -> RUN_SHEET_OK 19"
        status: pass
    human_judgment: false
  - id: D6
    description: "Run-sheet safety prohibition (flagged, unresolved in the plan): in the live tab Claude takes no action beyond read-only evaluation and data-zhroma-probe markers, and no probe returns identifying text"
    requirement: RECON-04
    verification: []
    human_judgment: true
    rationale: "The static check and a synthetic happy-dom run prove the probe code; whether the live session keeps to user-only interaction, and whether real Zendesk markup makes any probe echo tenant text, can only be judged during and after the Plan 03 session"
  - id: D7
    description: "D-26 notes in ROADMAP.md and REQUIREMENTS.md"
    requirement: RECON-06
    verification:
      - kind: other
        ref: "grep for tags-column: not-offered and D-26 in both files"
        status: pass
    human_judgment: false

# Metrics
duration: 20min
completed: 2026-09-25
status: complete
---

# Phase 6 Plan 02: Recon 2 Gate, Ledger Scaffold and Run Sheet Summary

**New `recon2` mode in the recon gate. It registers the eight Recon 2 ledger ids and rejects any missing, pending or inconsistent fact. It derives the D-24 proceed/block verdict from the facts and checks each fixture outcome against the admitted rule-columns corpus. A pending Recon 2 block now sits in `SELECTORS.md`, and a one-sitting run sheet holds 17 read-only one-line probes and a capture path that keeps raw DOM out of the transcript. The Phase 1 gate is byte-identical and still proceeds.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-09-25T13:57:59Z
- **Completed:** 2026-09-25T14:18:11Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (2 created, 4 modified)

## Accomplishments

- `verifyRecon2Ledger(markdown, { admittedRecon2Scenarios })` runs its checks in a fixed order:
  1. placement: every `## Recon 2 ` heading is contiguous and before the Phase 1 assumptions and verdict;
  2. the generic sensitive scan over the whole block;
  3. registration of the eight ids with scope `English path` and a terminal status (`verified`, `disproved` or `not observed`);
  4. the closed-enum structured facts for each entry;
  5. the derived D-24 verdict;
  6. the D-23 fixture outcomes (`admitted`, `rejected` with a code and a consuming-phase fallback, or `not-required` only when the scenario is ineligible).
- 15 new `recon-two-*` codes, all letters and hyphens. The `recon2 <ledger> <manifest>` CLI calls `validateRecon2Fixtures` and prints `RECON 2 VERDICT: proceed` or `RECON 2 VERDICT: block`.
- `SELECTORS.md` gained 122 lines and lost none: `## Recon 2 Session Handoff`, eight `## Recon 2 Entry:` sections with D-24 fallbacks, and `## Recon 2 Verdict`, all pending. Everything from `## Spec-less Planning Assumptions` to the end of the file is unchanged. `final` still prints `FINAL VERDICT: proceed` and `evidence` still prints `EVIDENCE READY: 18 terminal entries`. `recon2` rejects with exactly `recon-two-status-unresolved`.
- `06-RUN-SHEET.md` covers:
  - the rules and a before-you-start section that restates the Plan 01 `denylist-entry-collides` rule;
  - steps 0 to 8, with a `session-state` after each step;
  - 17 probes and the `stash`/`copy` projection;
  - a recording map for every ledger field;
  - how to resume after an interruption.

  Every probe passed the plan's static check (`RUN_SHEET_OK 19`). In a scratch run against a synthetic Zendesk-like page in happy-dom, every probe returned structure only. The `stash`/`copy` output for both the identity region and the table was also admitted by the rule-columns sanitiser.
- The D-26 Tags note is now under ROADMAP.md Phase 6 success criterion 3 and under REQUIREMENTS.md RECON-06.
- Tests: `node --test test/recon/*.smoke.js` passes 110 of 110 (47 of them new), `npm run test:recon` passes 1166 vitest tests, and nothing changed under `extension/` or `test/extension/`.

## Task Commits

1. **Task 1: Recon 2 ledger gate and the `recon2` CLI mode**: RED `5ca010d` (test), GREEN `5350a91` (feat)
2. **Task 2: Register the Recon 2 block in SELECTORS.md and add the D-26 roadmap notes**: `1b383c7` (docs)
3. **Task 3: Write the one-sitting run sheet**: `a3c3fbb` (docs)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD Gate Compliance

- Task 1: RED `5ca010d` came before GREEN `5350a91`. The RED run had 42 tests, 1 passing and 41 failing. The target was the `Recon 2 gate exports` suite, which failed on its assertion (`typeof verifyRecon2Ledger` was `'undefined'`, not `'function'`). `check tdd-red-evidence` returned RED_EVIDENCE_OK.
- The checker reads only top-level TAP names, so the RED record names the suite rather than the test inside it.
- There is no REFACTOR commit because no cleanup was needed.

## Files Created/Modified

- `scripts/verify-recon-gate.js`:
  - new constants `RECON2_ENTRY_HEADING`, `RECON2_VERDICT_HEADING`, `RECON2_TERMINAL_STATUSES` and the exported `RECON2_REQUIRED_IDS`;
  - new private checks per entry group and the exported `verifyRecon2Ledger`;
  - the `recon2` branch in `runCli`.

  `verifyReconLedger`, `parseEntries`, `parseVerdict` and every existing constant are unchanged.
- `test/recon/recon2-gate.smoke.js`: node:test coverage for every behaviour and code, the real-ledger registration checks, Phase 1 non-regression on an in-memory copy of the ledger, and CLI runs against fixtures sanitised under `tmpdir()`.
- `SELECTORS.md`: the pending Recon 2 block.
- `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`: one D-26 note line each.
- `.planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md`: the operator script for Plan 03.

## Decisions Made

- **Structure versus rule codes:** a closed-enum field with an out-of-set value rejects `recon-two-field-not-structured`. A structurally valid value that breaks a rule rejects `recon-two-fields-inconsistent`, for example `zhroma-off: no`, `os-auto-used: yes`, or `tags-column: observed` without a `tags-cell`.
- **Contiguous block:** a Recon 2 heading separated from the block by any other heading rejects `recon-two-block-misplaced`, so no Recon 2 text can escape the sensitive scan. A mutation spot-check exposed the gap, and a test now covers it.
- **Phase 10 fallback for no name:** when `identity-source` is `not-found`, both identity entries need a fallback that names Phase 10. This is how the plan's "a Phase 10 fallback" requirement is enforced.
- **Reused codes:** the Phase 1 shape codes (`entry-field-missing`, `entry-id-invalid`, `entry-heading-id-mismatch`, `entry-id-duplicate`) and `admitted-scenarios-required` are reused rather than given new `recon-two-*` equivalents.
- **P2 markers:** P2 marks the candidates it finds with `data-zhroma-probe="identity-hit"`, so repeated runs can tell at-load, lazy and menu-only identity apart without returning a string. `stash` clears every probe marker on its clone before it sets shape markers, so those markers never reach the sanitiser.
- **P4 observer options:** P4 drops `characterData` from its observer options, because the literal `characterData:` contains `data:`, which the sensitive scan's URL rule rejects. Style text changes still arrive as head `childList` records.
- **Committing on `main`:** as in Plan 01, the orchestrator ran this plan as a sequential executor on `main` with normal commits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Contiguity check and extra code coverage for the Recon 2 block**
- **Found during:** Task 1 (GREEN, mutation spot-check)
- **Issue:** disabling the contiguity check left all tests green. A Recon 2 heading placed after an unrelated heading, but still before Spec-less Planning Assumptions, would have been parsed without being scanned.
- **Fix:** added the detached-heading case to the placement test. Also added a test for the three reused shape codes.
- **Files modified:** test/recon/recon2-gate.smoke.js
- **Verification:** the mutation now fails one test, and the suite passes.
- **Committed in:** `5350a91`

**2. [Rule 3 - Blocking] Smoke-test handoff regexes widened for the run sheet's state values**
- **Found during:** Task 3
- **Issue:** the Task 2 registration test accepted only letters and hyphens for `session-state` and only a digit for `next-step`. The run sheet defines `step-N-complete` and `next-step: admission`, so Plan 03 would have broken the test.
- **Fix:** the regexes now accept `[a-z0-9-]+` and `\d|admission`.
- **Files modified:** test/recon/recon2-gate.smoke.js
- **Committed in:** `a3c3fbb`

**3. [Scope note] The Task 2 and Task 3 commits also touch the Task 1 test file**
- Task 2 added the real-ledger registration and pending-rejection tests; this plan's must-haves require the pending rejection to be smoke-tested. Task 3 made the regex change above.

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking), plus 1 scope note.
**Impact on plan:** no change in scope. Every must-have truth and acceptance criterion is met.

## Issues Encountered

- `gsd-tools windows append` failed with `Ledger entry 11 has invalid kind: "accepted-risk"`. The problem is a pre-existing Phase 4 row in `.planning/WINDOWS.md`, not something this plan wrote. The ledger is best-effort, so the pending-scaffold stub is recorded only in Known Stubs below.

## Known Stubs

- `SELECTORS.md`, `## Recon 2 Session Handoff` through `## Recon 2 Verdict`: every entry and the verdict are `pending` by design. The `recon2` gate rejects them with `recon-two-status-unresolved` until Plan 03's live session fills them. This is the intended guard that the phase cannot close early.

## Threat Flags

None. The plan's threat register covers every new surface: the ledger scan (T-06-09), probe return values (T-06-10), probe side effects (T-06-11), block placement (T-06-12), fallbacks and derived verdicts (T-06-13) and value-free CLI output (T-06-14).

## User Setup Required

None for this plan. Plan 03's live session needs a private directory and a private denylist outside every checkout; the run sheet's "Before you start" section explains how.

## Next Phase Readiness

- Plan 03 can run the live session straight from `06-RUN-SHEET.md`. It fills the Recon 2 block, admits the three fixtures into `manifest.recon2Fixtures` with the rule-columns sanitiser, sets each `fixture-*` verdict field, and closes the phase when `node scripts/verify-recon-gate.js recon2 SELECTORS.md test/fixtures/manifest.json` prints a `RECON 2 VERDICT`.
- D6, the run-sheet safety prohibition, stays open for human judgment during and after the session.

## Self-Check: PASSED

- FOUND: scripts/verify-recon-gate.js, test/recon/recon2-gate.smoke.js, SELECTORS.md, .planning/phases/06-live-dom-recon-2/06-RUN-SHEET.md
- FOUND commits: 5ca010d, 5350a91, 1b383c7, a3c3fbb
- Plan verification:
  - `node --test test/recon/*.smoke.js`: 110 of 110 pass;
  - `npm run test:recon` with `GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json`: passes;
  - `final`: `FINAL VERDICT: proceed`;
  - `recon2`: exactly `RECON_GATE_REJECTED recon-two-status-unresolved`;
  - `git status --porcelain -- extension test/extension`: empty.

---
*Phase: 06-live-dom-recon-2*
*Completed: 2026-09-25*
