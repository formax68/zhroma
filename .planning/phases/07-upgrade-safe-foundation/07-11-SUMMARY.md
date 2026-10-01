---
phase: 07-upgrade-safe-foundation
plan: 11
subsystem: testing
tags: [node-vm, evidence-pinning, timing-judges, negative-controls, wr-01]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: "07-09 judge-slice text tripwire (timingJudgeSource, phase-04-timing-judge-changed)"
provides:
  - "buildTimingJudges(runnerText): pinned validateWorkloadReport run in a fresh null-prototype vm context on in-context-parsed JSON"
  - "readPhase04Source().judges built from the observation-revision blob of scripts/run-tint-workload.js"
  - "M1-M5 inline negative controls proving out-of-slice code and realm patches cannot move a pinned verdict"
  - "Phase 4 and Phase 3 live-acceptance validators judged by the pinned judges, with a re-import guard"
affects: [07-12, phase-07-verification, release-evidence]

actuals:
  tokens: 3544
  tasks: 3
  commits: 4
plan_head_before: 88d7deefc51acddd9d6f3efd797067bec2b2c0de
plan_head_after: 6da90dc2183ad472bf85572a609cfd9121718a21

tech-stack:
  added: []
  patterns:
    - "Execute pinned Git text, do not just compare it: judge slices run in createContext(Object.create(null), codeGeneration off)"
    - "Cross a realm boundary with JSON text parsed by the target realm's JSON.parse, return primitives only"
    - "Realm-patch windows: synchronous, no expect inside, restore in finally, thrown calls recorded as verdicts"

key-files:
  created: []
  modified:
    - scripts/phase-04-source.js
    - test/extension/performance-harness.test.js
    - test/extension/phase-04-live-acceptance.test.js
    - test/extension/phase-03-live-acceptance.test.js

key-decisions:
  - "Historical Phase 3/4 timing verdicts are computed by the pinned judge slices from Git in a null-prototype vm context; the text-equality check is kept as a tripwire only"
  - "Runs cross the vm boundary as JSON text parsed in-context (host objects carry the caller's Array.prototype, M3/M4); the sandbox has a null prototype (Object.prototype pollution, M5)"
  - "Phase 3 samples are judged by the Phase 4 pinned judges (same 04-09 judge text, passes all six Phase 3 runs)"
  - "Task 1 split into a RED test commit and a GREEN fix commit to follow the orchestrator's TDD gate sequence (four commits instead of the plan's three)"

patterns-established:
  - "Pinned-code execution: read a blob at a pinned revision, slice it, de-export, run it in a fresh null-prototype context"

requirements-completed: [COMPAT-04]

coverage:
  - id: D1
    description: "readPhase04Source().judges judges all 7 Phase 4 and 6 Phase 3 recorded runs as passed, and the crafted ok/slow/mixed runs honestly, from JSON text in a fresh context"
    requirement: COMPAT-04
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#every recorded Phase 4 and Phase 3 timing run is judged by the pinned judge code in a fresh context"
        status: pass
      - kind: other
        ref: "node --input-type=module end-to-end one-liner (prints PINNED_JUDGES_PASSED_13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "M1-M5 negative controls: each moves a verdict under the old arrangement; no pinned verdict moves; the text tripwire stays equal for M1-M4"
    requirement: COMPAT-04
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#%s outside the judge slices is invisible to the text tripwire and never executed by the pinned judges"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#M1 is live: the judge slices evaluated with OPERATIONS emptied pass runs that break the budgets"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#M2, M3 and M4 are live: a patched built-in moves the working-copy verdict and never a pinned verdict"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#M5 is live: a planted Object.prototype.Math reaches a judge over an ordinary sandbox and never the pinned judges"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase 4 and Phase 3 live-acceptance validators use the pinned judges with unchanged verdicts (Phase 4 human_needed 14/3, Phase 3 human_needed 11/9) and cannot re-import the runner"
    requirement: COMPAT-04
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#the recorded Phase 4 verdict keeps its fourteen passes and its three named pending checks"
        status: pass
      - kind: unit
        ref: "test/extension/phase-03-live-acceptance.test.js (all 30 tests, existing assertions unchanged)"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#the Phase 4 and Phase 3 live-acceptance validators never re-import the timing runner"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon (tsc x2, 112 node tests, 1455 vitest tests)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-01
status: complete
---

# Phase 7 Plan 11: Pinned Timing Judges Summary

**The historical Phase 3 and Phase 4 timing verdicts now come from the judge code pinned in Git. The adapter runs it with `node:vm` in a fresh null-prototype context, on JSON text parsed inside that context, so nothing in the working copy can reach it.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-01T17:47:36Z
- **Completed:** 2026-10-01T17:53:46Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- `buildTimingJudges(runnerText)` in `scripts/phase-04-source.js` takes the existing `timingJudgeSource` slices and strips `export`. It runs them in `createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } })` with nothing injected, and exposes a frozen `validateWorkloadReport(json)`. That method refuses a non-string input (`phase-04-timing-judge-input`) and returns a primitive string.
- `readPhase04Source().judges` is built from the same pinned blob text that the `phase-04-timing-judge-changed` tripwire compares. The plan adds no disk read, no fallback and no dependency. The file still has exactly one `readFileSync(` token, and importing it has no side effects.
- The M1 to M5 negative controls each move a verdict under the old arrangement, and none of them moves a pinned verdict.
- Both live-acceptance validators stopped importing the runner. Their recorded verdicts are unchanged, and a guard test fails if either file imports the runner again.

## Task Commits

1. **Task 1 (RED): failing pinned-judge test.** `bfd364c` (test). This is the RED gate commit.
2. **Task 1 (GREEN): adapter `buildTimingJudges` + `judges`.** `029f031` (fix). This is the GREEN gate commit.
3. **Task 2: M1-M5 negative controls.** `b9067c1` (test)
4. **Task 3: live-acceptance repoint + re-import guard (own commit, D-25/D-06).** `6da90dc` (test)

07-12 should cite these SHAs. The adapter is `029f031`, the controls are `b9067c1` and the repoint is `6da90dc`. The RED test is `bfd364c`.

## Test Counts (the three files)

| File | Before | After |
|------|--------|-------|
| test/extension/performance-harness.test.js | 24 | 33 (+1 pinned-verdict, +4 tripwire-blindness cases, +3 liveness, +1 re-import guard) |
| test/extension/phase-04-live-acceptance.test.js | 109 | 109 |
| test/extension/phase-03-live-acceptance.test.js | 30 | 30 |
| **Total** | **163** | **172** |

Full suite (`npm run test:recon`): both tsc passes are clean, 112/112 node smoke tests and 1455/1455 vitest tests pass, exit 0.

## Measured M1-M5 Flips

All three crafted runs come from the file's own `run()` and `sample()` helpers:

- `ok`: an unmodified `run()`.
- `slow`: an 18 ms edit sample.
- `mixed`: 40 × 1 ms then 60 × 3 ms, which gives a 3 ms median.

Honest verdicts are `passed` / `gaps_found` / `gaps_found`.

| Mutant | Old arrangement (measured) | Pinned judges | Tripwire text |
|--------|----------------------------|---------------|---------------|
| M1 `OPERATIONS.length = 0;` after `const finite` | slices + M1: `slow` → `passed`, `mixed` → `passed` | honest on all three | equal |
| M2 `Math.ceil = () => 1;` | working copy: `mixed` → `passed` | honest on all three | equal |
| M3 `Array.prototype.sort = function () { return this; };` | working copy: `slow` → `passed` | honest on all three | equal |
| M4 `Array.prototype.at = function () { return 99; };` | working copy: `ok` → `gaps_found`; reviewer's sketch (null-proto context, host object): `ok` → `gaps_found` | honest on all three | equal |
| M5 `Object.prototype.Math = { abs, ceil: () => 1 }` | `{}`-sandbox judge: `mixed` → `passed` | `mixed` → `gaps_found` | n/a |

I also checked that the controls catch a regression in the adapter. I temporarily changed the adapter to use a `{}` sandbox, and the M5 control failed. I temporarily moved `JSON.parse` to the host side, and the M2-M4 control failed. I temporarily added a runner import back to phase-03, and the re-import guard failed. All three probes were reverted and nothing from them was committed.

## Files Created/Modified

- `scripts/phase-04-source.js`: adds the `node:vm` import, `buildTimingJudges`, the `judges` member of the frozen result, and a rewritten comment on the harness block.
- `test/extension/performance-harness.test.js`: adds the pinned-verdict test, the M1-M5 controls and the re-import guard. Existing tests are byte-identical.
- `test/extension/phase-04-live-acceptance.test.js`: removes the runner import. The timing verdict now comes from `OBSERVED_SOURCE.judges.validateWorkloadReport(JSON.stringify(run))`.
- `test/extension/phase-03-live-acceptance.test.js`: replaces the runner import with `readPhase04Source`. A module-scope `judges` const is used at the timing call site, with a comment explaining why.

## Decisions Made

- The Phase 3 samples are judged by the Phase 4 pinned judges, as the plan specifies. The module-scope const is named `judges`, so the call site literally reads `judges.validateWorkloadReport(`. The plan's acceptance grep and the new guard test both look for that string.
- The sandbox completion value is an in-context object. The host wrapper captures its single method once and never reads a property again.

## Deviations from Plan

**1. [Orchestrator instruction - TDD gate] Task 1 committed as RED + GREEN, so the plan has four commits instead of three**
- **Found during:** Task 1
- **Issue:** The plan describes Task 1 as one `fix(07-11)` commit holding both the adapter and its test. The orchestrator asked for the RED → GREEN gate sequence for this TDD-applicable plan.
- **Fix:** `bfd364c` adds the failing test alone. I checked the RED evidence with `check tdd-red-evidence`, which returned `RED_EVIDENCE_OK` / `target_test_failed` (assertion `expected 'undefined' to be 'function'`). Vitest's `tap-flat` output has no node-test `# tests/# pass/# fail` summary, so I derived those lines from the ok/not ok lines before running the check. `029f031` then adds the adapter with the plan's exact `fix(07-11): ...` message.
- **Impact:** None on the content. Tasks 2 and 3 are still separate single-purpose commits, and the repoint is still its own commit.

**2. [Rule 1 - Bug] Phase 3 judges const renamed so the plan's acceptance grep matches**
- **Found during:** Task 3
- **Issue:** I first named the const `PINNED_JUDGES`. The call site `PINNED_JUDGES.validateWorkloadReport(` does not contain the lowercase `judges.validateWorkloadReport(` that the acceptance criterion and the guard test require.
- **Fix:** Renamed it to `judges` before committing.
- **Committed in:** `6da90dc`

---

**Total deviations:** 2 (1 commit-structure change at the orchestrator's instruction, 1 self-caught naming fix). Scope did not change.

## Issues Encountered

- Task 1's acceptance check `git status --porcelain -- extension .planning/phases/05-published ...` is not empty. It lists `.planning/phases/05-published/release-runs/rc-01-walkthrough.md`, which was untracked before this plan started and is not this plan's file. No commit in this plan touches `extension/`, `test/extension/frozen-contract.test.js`, `test/mutants/` or `.planning/phases/05-published/`, which I checked with `git diff --name-only 88d7dee..HEAD`.
- The estimate was 60000 tokens. The diff came to about 3.5k on the chars/4 scale. The estimate's confidence was marked `low`.

## TDD Gate Compliance

- RED: `bfd364c` `test(07-11): add failing test for the pinned timing judges`. The target test failed on its first assertion, and the evidence check returned `RED_EVIDENCE_OK`.
- GREEN: `029f031` `fix(07-11): ...`. It uses the `fix` type because the plan names that message. No `feat(07-11)` commit exists, so a grep that looks only for `^feat\(07-11\)` will not find the GREEN gate.
- REFACTOR: none needed.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- G-07-4a / WR-01 is closed in code, and 07-12 can cite `029f031`, `b9067c1` and `6da90dc`.
- No blockers.

## Self-Check: PASSED

- FOUND: scripts/phase-04-source.js, test/extension/performance-harness.test.js, test/extension/phase-04-live-acceptance.test.js, test/extension/phase-03-live-acceptance.test.js
- FOUND commits: bfd364c, 029f031, b9067c1, 6da90dc
- Plan verification: the three-file vitest run passes (172), the one-liner prints `PINNED_JUDGES_PASSED_13`, and `test:recon` exits 0

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-10-01*
