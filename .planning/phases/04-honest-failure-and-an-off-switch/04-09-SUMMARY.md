---
phase: 04-honest-failure-and-an-off-switch
plan: "09"
subsystem: testing
tags: [performance-harness, chrome-devtools-protocol, node-vm, mutation-observer, chrome-storage, workload]

requires:
  - phase: 04-05
    provides: "The test-only preference seam in test/performance/tint-workload.js that this plan widens to answer a stored false"
  - phase: 03
    provides: "validateWorkloadReport and the historical 03-PERFORMANCE samples whose no-runtime-field shape this plan must keep validating"
provides:
  - "Page-level parameter validation: an unrecognised mode or a non-positive-integer size throws before any measurement is taken"
  - "A third `dormant` run mode that installs the seam, stores a real false, loads extension/content.js and asserts genuine dormancy"
  - "A `runtime` report field ('loaded' | 'absent') that names the no-runtime baseline instead of conflating it with the shipped off state"
  - "A dormant branch in validateWorkloadReport that is conditional, so Phase 3's historical samples and the six canonical Phase 4 runs validate unchanged"
affects: [04-11, phase-04-validation, phase-04-live-acceptance, performance-evidence]

actuals:
  tokens: 4334
  tasks: 2
  commits: 5
plan_head_before: a009ef4b2849a22c408fb8fcd6586ab7ebd50e5c

tech-stack:
  added: []
  patterns:
    - "Validate run parameters at the top of the page IIFE, above every capture, so a bad parameter throws before any DOM or prototype work"
    - "Label a report from the validated input, never from a derived boolean"
    - "A new report requirement is conditional on the new mode, so historical evidence keeps validating"
    - "Evaluate the workload page in a node:vm context with a plain `location` object to test its parameter handling without a browser"

key-files:
  created: []
  modified:
    - test/performance/tint-workload.js
    - scripts/run-tint-workload.js
    - test/extension/performance-harness.test.js
    - .planning/WINDOWS.md

key-decisions:
  - "The page validates size as any positive integer, deliberately NOT the CLI's 30/200/1000 set: the CLI constraint is a protocol decision about which runs are canonical evidence, the page's is about whether a run can be measured at all. Duplicating the CLI rule in the page would have created a second copy to drift."
  - "`runtime` is required only when run.mode === 'dormant'. Requiring it unconditionally would have turned Phase 3's bound samples red for a reason unrelated to Phase 3 (T-04G-12)."
  - "No timing budget applies to a dormant run. The claim dormancy makes is zero observable work, not a fast amount of it, so callbacks === 0 and writes === 0 are the whole assertion."
  - "The dormant run is stored under a `<size>-dormant` key and is additional evidence. mergeReport's six canonical `{30,200,1000}-{enabled,disabled}` keys were left untouched, so a dormant run can never become a seventh required run."

patterns-established:
  - "Fail-loud run parameters: a harness that can be invoked wrongly must refuse the wrong invocation itself, not rely on the one caller that happens to check"
  - "Name the baseline: when a control measures a different program, say so in the recorded evidence rather than in prose a reader may not reach"

requirements-completed: [CTRL-02, CTRL-04]

coverage:
  - id: D1
    description: "A mis-invoked workload run throws before any measurement: an unrecognised mode or a non-positive-integer size is refused by the page itself, with the offending value named in the message."
    requirement: "CTRL-02"
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#a mis-invoked workload page throws before measuring anything"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#the workload page accepts mode enabled/disabled/dormant"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#CLI accepts the dormant mode and still refuses a near-miss of a real one"
        status: pass
    human_judgment: false
  - id: D2
    description: "The recorded timing evidence distinguishes a loaded controller that declines to act from a page with no extension at all: the report carries `runtime: 'loaded' | 'absent'`, and validateWorkloadReport refuses a dormant run that claims 'absent' or declares no runtime."
    requirement: "CTRL-02"
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#a dormant run is accepted only when it proves the runtime was actually loaded"
        status: pass
    human_judgment: false
  - id: D3
    description: "A dormant run exercises a stored false through the shipped content script in real Chrome and records zero markers, zero observers and zero pending timers."
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "node scripts/run-tint-workload.js --size 30 --mode dormant --smoke"
        status: pass
    human_judgment: false
  - id: D4
    description: "The six canonical enabled/disabled runs, and Phase 3's existing samples, validate exactly as they do today — including runs that carry no `runtime` field at all."
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#historical runs carrying no runtime field still validate exactly as before"
        status: pass
      - kind: unit
        ref: "test/extension/performance-harness.test.js#a dormant run is extra evidence, never a seventh required run"
        status: pass
      - kind: integration
        ref: "test/extension/phase-03-live-acceptance.test.js (30 passed, PHASE 03 LIVE ACCEPTANCE STATUS: human_needed)"
        status: pass
      - kind: integration
        ref: "node scripts/run-tint-workload.js --size 30 --mode enabled --smoke"
        status: pass
    human_judgment: false
  - id: D5
    description: "The prohibition this plan mints — a passing test or measurement run must not be presented as guarding a property it does not actually exercise — holds for the new dormant evidence itself."
    verification: []
    human_judgment: true
    rationale: "Whether the dormant mode's evidence is presented at the strength it actually carries is a judgment about how 04-VALIDATION.md and 04-LIVE-ACCEPTANCE.md word it, not a property any test can assert. The dormant run is SYNTHETIC — a constructed table, not a real Zendesk view — and must not be promoted into a live observation. 04-11 regenerates the samples and is where the wording lands."

duration: 8 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 09: Honest Workload Parameters and a Real Dormancy Measurement Summary

**The workload page now refuses a mis-invoked run before it measures anything, and a third `dormant` mode stores a real `false` through the shipped content script so the off-state control measures a loaded controller declining to act rather than a page with no extension on it.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-10T15:36:05Z
- **Completed:** 2026-09-10T15:44:21Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 4 (3 source, 1 planning ledger)

## Accomplishments

- **WR-09 half one — the mode parameter no longer fails open.** `test/performance/tint-workload.js` read its mode as `params.get('mode') === 'enabled'`, so a typo, a wrong value or an omitted parameter silently meant *disabled* — which installs no seam, loads no runtime and measures nothing, while `verify()` happily confirmed zero markers and zero observers and the run reported `passed` with exit 0. Parameters are now read and validated at the very top of the IIFE, above the native-timer and prototype captures, and throw an `Error` naming the received value.
- **WR-09 half two — a run that measures the shipped off state.** `installPreferenceSeam` now takes the storage area's actual contents and fills a key from the caller's defaults only when the store lacks it, matching the `chrome.storage.local` contract the shipped script relies on. The new `dormant` mode seeds `{ enabled: false }`, installs the seam, loads `/extension/content.js` and awaits the preference confirmation. `content.js`'s `applyPreference` sets `preferenceReady = true, preferenceEnabled = false` on a stored boolean `false`, so the run measures a *confirmed off* controller, not an unconfirmed one.
- **The no-runtime baseline is now named, not conflated.** The report carries `runtime: 'loaded' | 'absent'`, and `mode` is the validated string rather than `enabled ? 'enabled' : 'disabled'`, so a run can no longer mislabel itself. The comment claiming the disabled control was "genuinely disabled rather than merely switched off" was replaced with the honest statement: `disabled` is a no-runtime baseline, and `dormant` is the run that measures the shipped off state.
- **Backward compatibility is pinned, not assumed.** `runtime` is required only for `run.mode === 'dormant'`; the `enabled` and `disabled` branches are unchanged and `mergeReport`'s six-key `timingStatus` list was left alone. Two new tests hold that line: enabled and disabled runs carrying no `runtime` field still validate `passed`, and a `30-dormant` key merges as extra evidence without becoming a seventh required run.

## Task Commits

1. **Task 1 RED: failing coverage for workload parameter validation** — `6aed242` (test)
2. **Task 1 GREEN: validate workload parameters before any measurement** — `efc385f` (feat)
3. **Task 2 RED: failing coverage for dormant-run validation** — `1f41a46` (test)
4. **Task 2 GREEN: measure the real dormancy cost of a loaded controller** — `43cfb4a` (feat)

**Plan metadata:** the commit carrying this SUMMARY, `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/WINDOWS.md` — the fifth and final commit of this plan. `actuals.commits: 5` is MEASURED as `git rev-list --count a009ef4b2849a22c408fb8fcd6586ab7ebd50e5c..HEAD` with that commit included.

Neither task needed a REFACTOR commit — the GREEN implementations are the final shape, and inventing a cleanup commit to complete the triad would have been ceremony rather than discipline.

## TDD Gate Compliance

Both tasks ran a full RED gate with machine-checked evidence.

| Task | RED | GREEN | REFACTOR | RED verdict |
|------|-----|-------|----------|-------------|
| 1 | `6aed242` | `efc385f` | — (no change needed) | `RED_EVIDENCE_OK` — 8 failed / 11 passed of 19 |
| 2 | `1f41a46` | `43cfb4a` | — (no change needed) | `RED_EVIDENCE_OK` — 1 failed / 21 passed of 22 |

**Both RED runs failed intentionally, on assertions for the planned behaviour**, not on load or syntax errors. Task 1's target test was `a mis-invoked workload page throws before measuring anything (?size=30&mode=enabledd)`, failing with `expected [Function] to throw an error`. Task 2's target test was `a dormant run is accepted only when it proves the runtime was actually loaded`, failing because `validateWorkloadReport` rejected the mode outright with `Invalid run scope` rather than with the dormant-specific refusal the test demands.

**One honest note about how the evidence was recorded.** `gsd-tools check tdd-red-evidence` parses node:test's TAP trailer (`# tests` / `# pass` / `# fail`). Vitest's `tap-flat` reporter emits `1..N` and `ok`/`not ok` lines but no such trailer, so the first submission of both records was classified `INVALID_RED` with reason `zero_tests_discovered` — a reporter-format incompatibility, not a bad RED. The records were re-submitted with the trailer lines appended, **computed from the real `ok`/`not ok` counts of the same run** (19/11/8 and 22/21/1). No count was invented and no run was re-executed to produce a friendlier number.

## Files Created/Modified

- `test/performance/tint-workload.js` — Parameters validated at the top of the IIFE; `enabled` and the new `runtimeLoaded` derived from the validated mode; `installPreferenceSeam(stored)` backed by a real store; the `ready` guard switched from `if (enabled)` to `if (runtimeLoaded)`; the report labels itself `mode` + `runtime`.
- `scripts/run-tint-workload.js` — `parseArguments` accepts `--mode dormant`; `validateWorkloadReport` accepts dormant with a `runtime: 'loaded'` requirement and a zero-callback/zero-write rule and no timing budget; the smoke path asserts the dormant claim.
- `test/extension/performance-harness.test.js` — A `node:vm` harness that evaluates the workload page with a plain `location` object, seven parameter-rejection cases, three valid-mode cases, dormant validation cases, and two backward-compatibility pins.
- `.planning/WINDOWS.md` — Entry 15: `04-PERFORMANCE-SAMPLES.json` is now unmergeable, owned by 04-11.

## Verification Results

All plan-level `<verification>` items were run and logged.

| # | Check | Result |
|---|-------|--------|
| 1 | `vitest run performance-harness + phase-03-live-acceptance + live-acceptance` | **PASS** — `Test Files 3 passed (3)`, `Tests 109 passed (109)`; `PHASE 03 LIVE ACCEPTANCE STATUS: human_needed` printed unchanged |
| 2 | `node scripts/run-tint-workload.js --size 30 --mode dormant --smoke` | **PASS** — exit 0, `TINT WORKLOAD SMOKE: passed`, `callbacks: 0`, `writes: 0`, and the CLI's own guards confirmed `resources.observers === 0` and `resources.pendingTimers === 0` |
| 3 | `node scripts/run-tint-workload.js --size 30 --mode enabled --smoke` | **PASS** — exit 0, `TINT WORKLOAD SMOKE: passed`, `callbacks: 4`, `writes: 2` (unchanged by the new mode) |
| 4 | `parseArguments(['--mode','enabledd'])` throws; `parseArguments(['--mode','dormant'])` succeeds | **PASS** — throws `Mode must be enabled, disabled or dormant`; returns `mode: 'dormant'` |
| 5 | A synthetic disabled run with no `runtime` field still validates `passed` | **PASS** — and the same for an enabled run |

### The exact rejection messages

| Query string | Thrown message |
|---|---|
| `?size=30&mode=enabledd` | `Unsupported workload mode "enabledd"; expected enabled, disabled, dormant` |
| `?size=30` | `Unsupported workload mode null; expected enabled, disabled, dormant` |
| `?mode=enabled` | `Unsupported workload size null; expected a positive integer` |
| `?size=0&mode=enabled` | `Unsupported workload size "0"; expected a positive integer` |
| `?size=-1&mode=enabled` | `Unsupported workload size "-1"; expected a positive integer` |
| `?size=abc&mode=enabled` | `Unsupported workload size "abc"; expected a positive integer` |
| `?size=30.5&mode=enabled` | `Unsupported workload size "30.5"; expected a positive integer` |

The accepted mode set is exactly `enabled`, `disabled`, `dormant` — in both the page and the CLI. The page accepts any positive integer size; the CLI still restricts `--size` to 30/200/1000.

### The dormant smoke output

```
TINT WORKLOAD SMOKE: passed
identity.harnessHash: 285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b
status: smoke_passed
metrics.edit: { count: 1, median: 0, p95: 0, max: 0, latencyMedian: 15.30,
                observerCpu: 0, timerCpu: 0, callbacks: 0, passes: 0, writes: 0 }
```

The zeros are load-bearing here in a way they were not for the old `disabled` control: `extension/content.js` was fetched and executed, `preferenceConfirmed` only resolves when the shipped script calls `chrome.storage.local.get`, and the seam answered that call with a stored `false`. A run where the script failed to load would have thrown `Runtime load failed` or hung on the confirmation; a run where the controller acted anyway would have failed `verify()`'s `observers.size === 0`. `observers.size === 0` is now a real assertion about the shipped controller rather than the tautology it was when no controller was present.

## `04-PERFORMANCE-SAMPLES.json` is now unmergeable — 04-11 regenerates it

**This is expected and correct, and it was declared in the plan.** `identity.harnessHash` hashes `scripts/run-tint-workload.js` together with `test/performance/tint-workload.js`, and this plan edited both:

- recorded in `04-PERFORMANCE-SAMPLES.json`: `f889a9eb8b2ff52bbca303a7a1dfe1039449a006ecc4afbf552999e917978877`
- current source: `285074ead931dde0f5212951835e10da5e1fb70ba1f8d1a51142ee93b715617b`

`mergeReport` refuses a mixed identity, so appending to the existing file is now impossible. **Nothing was appended and nothing was deleted.** The file keeps its six canonical runs and `timingStatus: passed` as history; regenerating a fresh file against final source — including a re-measured dormant run — is 04-11 Task 2's work. Recorded as WINDOWS entry 15.

## Decisions Made

- **The page's size rule is "positive integer", not the CLI's 30/200/1000.** These are two different questions. The CLI's set decides which runs count as canonical evidence; the page's rule decides whether a run can be measured at all. Encoding the CLI's set in the page would have created a second copy of a protocol constraint that would drift the first time the canonical set changed.
- **`runtime` is conditional on the dormant mode.** Requiring it of every run would have invalidated Phase 3's bound samples and turned a green suite red for a reason having nothing to do with Phase 3 (T-04G-12). The no-`runtime` case is pinned by a test so a future edit cannot quietly tighten it.
- **A dormant run gets no timing budget.** Dormancy's claim is zero observable work, not a fast amount of it; `callbacks === 0 && writes === 0` is the entire assertion, and a latency threshold on top would have implied the harness was measuring something it is not.
- **`verify()` was left keyed on `enabled`.** Both `dormant` and `disabled` expect `null` markers and zero observers. No change was needed — but the meaning of the dormant assertion is entirely different, and the comment above the `ready` guard now says so.

## Deviations from Plan

None — plan executed exactly as written. No deviation rule fired.

Two things worth naming that are *not* deviations:

- **The RED-evidence record needed a TAP trailer appended** (see TDD Gate Compliance). That is a reporter-format gap between Vitest and a verb written for node:test, handled transparently with the run's real counts.
- **`.planning/WINDOWS.md` was appended by hand.** `gsd-tools windows append` fails on this repository with `Ledger entry 11 has invalid kind: "accepted-risk"` — it validates the whole ledger before appending. Entry 15 was written into both the markdown table and the JSON array, the JSON was re-parsed to confirm validity, and `open_count`/`total_count` were incremented (9→10, 14→15). Entries 12 and 13 were not touched.

## Issues Encountered

- **A pre-existing WINDOWS.md inconsistency was observed and deliberately left alone.** The JSON array records entry 11 as `fixed` while the markdown table row still says `open`, and the frontmatter's `fixed_count: 3` disagrees with the four `fixed` entries actually present (`waived_count: 0` likewise ignores entry 12's `accepted` status). This predates this plan, is unrelated to its files, and falls outside its scope boundary. Only the two counts this plan's own entry moves were incremented.

## Threat Flags

None. This plan touches no file under `extension/`, installs no package, and adds no network or storage surface. `runtime-contract.test.js` and `toolbar-popup.test.js` pin the packaged inventory recursively, so neither modified test file can leak into the store zip. All three `mitigate` dispositions from the plan's register were implemented: T-04G-09 (parameter validation + self-labelling report), T-04G-10 (`runtime` field + the dormant mode), T-04G-12 (conditional requirement + backward-compatibility test).

## Requirements

`requirements-completed` copies the plan's `requirements` array verbatim, but **neither requirement is resolved by this plan and neither should be read as satisfied.** The deterministic edge probe classified all seven of this phase's requirement IDs as `unclassified`, therefore `unresolved`:

- **CTRL-02** — the dormant mode measures what the off state *costs*; it does not establish what the off state *must* cost. Cross-process application is bounded by platform behaviour.
- **CTRL-04** — "without requiring a page refresh" is observable only in a live browser. A synthetic workload measures timing, not that promise.

The dormant evidence is **synthetic**: a constructed table, not a real Zendesk view. `04-LIVE-ACCEPTANCE.md`'s `synthetic-is-not-live` guard exists precisely so this cannot be promoted into a live observation, and nothing here attempts to.

## Known Stubs

None.

## User Setup Required

None — no external service configuration required.

## Full-suite state

`npm test` reports `Tests 1 failed | 558 passed (559)`. The single failure is `phase-04-live-acceptance.test.js > the repository record binds to every current shipped byte and reports its actual status` — the acceptance byte pin, red because 04-07 and 04-08 changed `extension/content.js`, `extension/zhroma.css` and `extension/background.js` in this same wave. **That failure is not this plan's**: this plan modifies no file under `extension/` and so cannot move the byte binding. It is WINDOWS entry 13 and is 04-11's to close.

## Next Phase Readiness

- WR-09 is closed on both counts and its coverage is committed.
- **04-11 must regenerate `04-PERFORMANCE-SAMPLES.json`** against final source (the identity is now mixed) and should record a `30-dormant` run alongside the six canonical keys.
- 04-11 also re-establishes the acceptance byte pin for the whole wave.
- No blocker introduced. The `--mode dormant` path is available to any later plan that wants to measure the off state.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*

## Self-Check: PASSED

All modified files exist on disk; all four task commits (`6aed242`, `efc385f`, `1f41a46`, `43cfb4a`) are present in `git log`. Commit count MEASURED from `a009ef4b2849a22c408fb8fcd6586ab7ebd50e5c..HEAD` via `git rev-list --count`: 5 (four task commits plus the plan-metadata commit carrying this file).
