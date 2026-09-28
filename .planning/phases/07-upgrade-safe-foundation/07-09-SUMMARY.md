---
phase: 07-upgrade-safe-foundation
plan: 09
subsystem: testing
tags: [performance, chrome, cdp, d-29, mutation, evidence]
requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-01 scripts/baseline-source.js (pinned 0.1.0 blobs), 07-03 manifest listing zhroma-settings.js before content.js, 07-07/07-08 final 52-mutant registry and typecheck-first test:recon
provides:
  - scripts/run-tint-workload.js --source working|baseline, manifest-derived served assets, identity.source
  - test/performance/tint-workload.js manifest-ordered injection and a settings-read-aware seam
  - 07-PERFORMANCE.md with 07-PERFORMANCE-SAMPLES.json and 07-PERFORMANCE-BASELINE-SAMPLES.json (same-session D-29 record)
  - 07-MUTATION-KILLS.jsonl (52/52 killed on the timed bytes)
  - scripts/phase-04-source.js timingJudgeSource (the Phase 4 harness identified from Git, only its judges pinned to committed text)
affects: [08-themes, 09-colouring-rules, 10-rule-editor, 11-release]
actuals:
  tokens: 6800    # chars/4 over the hand-written diff (scripts, tests, 07-PERFORMANCE.md); the generated sample JSON and JSONL are excluded
  tasks: 3
  commits: 4
plan_head_before: afad330115cefd4682ba051eedc6d5b459bf413d
plan_head_after: 96c2df7436e033f15378084b0ede5a72b4cb1080
tech-stack:
  added: []
  patterns:
    - "A timing report hashes exactly the assets the served manifest names, so it always binds to the bytes it measured"
    - "Historical harness identity comes from Git; only the judging code that decides historical verdicts is held to its committed text"
key-files:
  created:
    - .planning/phases/07-upgrade-safe-foundation/07-PERFORMANCE.md
    - .planning/phases/07-upgrade-safe-foundation/07-PERFORMANCE-SAMPLES.json
    - .planning/phases/07-upgrade-safe-foundation/07-PERFORMANCE-BASELINE-SAMPLES.json
    - .planning/phases/07-upgrade-safe-foundation/07-MUTATION-KILLS.jsonl
  modified:
    - scripts/run-tint-workload.js
    - test/performance/tint-workload.js
    - test/extension/performance-harness.test.js
    - scripts/phase-04-source.js
key-decisions:
  - "07-09: D-29 passed in one session (Chrome 153.0.8010.53, Apple M4): Phase 7 30-row largest family median 1.7 ms against 0.1.0 1.8 ms, |diff| 0.1 ms inside the 0.2 ms band; the timed source is df28338"
  - "07-09: scripts/phase-04-source.js identifies the Phase 4 timing harness from Git alone, as it already did for the validator, and pins only the judging code (OPERATIONS, requireValue, finite, summarizeSamples, validateWorkloadReport, mergeReport) to its committed text, because D-29 had to edit both harness files"
  - "07-09: the page confirms the preference only after the object-form enabled read has landed and no seam read is outstanding; the seam answers an array read with the stored keys it names and refuses any other key form"
requirements-completed: [COMPAT-04, COMPAT-01]
coverage:
  - id: D1
    description: "The timing harness injects content_scripts[0].js in manifest order and, with --source baseline, serves the pinned 0.1.0 bytes through readBaselineSource, and each report hashes exactly the assets it served"
    requirement: COMPAT-04
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#CLI --source defaults to working, accepts working or baseline, and refuses anything else"
        status: pass
      - kind: integration
        ref: "node scripts/run-tint-workload.js --size 30 --mode enabled --smoke [--source baseline] -> smoke_passed both; 4 working hashes equal disk, 3 baseline hashes equal release/candidate.json"
        status: pass
    human_judgment: false
  - id: D2
    description: "Same-session D-29 comparison: Phase 7 1.7 ms vs 0.1.0 1.8 ms within max(10%, 0.2 ms); all seven working-tree runs pass the existing budgets"
    requirement: COMPAT-04
    verification:
      - kind: other
        ref: "timing-record check over 07-PERFORMANCE-SAMPLES.json and 07-PERFORMANCE-BASELINE-SAMPLES.json -> TIMING_RECORD_COMPLETE"
        status: pass
    human_judgment: false
  - id: D3
    description: "All 52 registered mutants (39 v1 plus 13 settings-foundation) are measured killed on the timed bytes"
    requirement: COMPAT-04
    verification:
      - kind: other
        ref: "npm run test:mutants -> exit 0, MUTATION KILLS: 52/52 killed (07-MUTATION-KILLS.jsonl); git diff --name-only df28338 HEAD -- extension prints nothing"
        status: pass
    human_judgment: false
  - id: D4
    description: "The full suite, including the parity harness under every upgrade state and the frozen contract, passes on the timed bytes"
    requirement: COMPAT-01
    verification:
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon -> typecheck, 112 smoke, 1441 Vitest, exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The Phase 4 acceptance adapter keeps its evidence guard after the harness edit: the harness is identified from Git and the judging code must equal its committed text"
    verification:
      - kind: unit
        ref: "test/extension/performance-harness.test.js#the pinned timing judge text moves with any judge edit and refuses a missing judge; test/extension/phase-04-live-acceptance.test.js"
        status: pass
    human_judgment: false
duration: 13min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 09: Same-Session Timing and Final Mutation Evidence Summary

**The Chrome timing harness now loads the manifest's content scripts in order and can serve the pinned 0.1.0 bytes. In one session the Phase 7 bytes time at 1.7 ms against 0.1.0's 1.8 ms, inside D-29's 0.2 ms band, and every existing budget passes. All 52 registered mutants are measured killed on the same bytes.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-28T11:23:06Z
- **Completed:** 2026-09-28T11:36Z
- **Tasks:** 3
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- `scripts/run-tint-workload.js` has a new `--source working|baseline` flag. The default is `working`, and a duplicate flag, a missing value or any other value is refused. The served assets now come from the served manifest: `manifest.json`, then `content_scripts[0].js` in order, then `content_scripts[0].css`. With `baseline`, the runner reads these only from `readBaselineSource().files` and never from `extension/`. `identity.hashes` covers exactly the served assets, and `identity.source` records which source ran.
- `test/performance/tint-workload.js` fetches `/extension/manifest.json` and injects each script in manifest order, awaiting each `onload` before the next. The seam admits exactly two reads: the array-form settings read, which answers only the stored keys it names, and the object-form `enabled` read. Measurement starts only after the `enabled` read has landed and no read is outstanding.
- D-29 comparison, run in one session (details in 07-PERFORMANCE.md):
  - The working tree's 30-row largest family median is 1.7 ms. The 0.1.0 median is 1.8 ms. The band is max(0.18, 0.2) = 0.2 ms and the difference is 0.1 ms, so the comparison passed.
  - All seven working-tree runs passed: 30, 200 and 1000 rows, each enabled and disabled, plus 30-row dormant.
  - Both medians are recorded next to the v1 figures of 1.3 ms and 1.4 ms, with the served-asset hashes for both sources, the Chrome version and revision, the OS and the CPU.
- The full mutation gate ran on the timed bytes (df28338, and `extension/` is unchanged at HEAD). It exited 0 and wrote one KILLED line for each of the 52 registered ids, ending with `MUTATION KILLS: 52/52 killed`. No test isolation needed restoring and no mutant was edited.
- On the same bytes the full suite passes: the typecheck, 112 smoke tests and 1441 Vitest tests. That includes the parity harness under all upgrade states and the frozen contract.
- Phase 7 ran no live smoke check (D-28). Review and repair after this plan is capped at one round (D-31). Leftover non-blocking findings go to the backlog, or to `.planning/WINDOWS.md` through `gsd-tools windows append`.

## Task Commits

1. **Deviation fix (before Task 1): the Phase 4 adapter pins only the timing judges.** `2441c64` (fix)
2. **Task 1: the timing harness runs the manifest's scripts and can serve the 0.1.0 bytes.** `df28338` (feat)
3. **Task 2: the same-session D-29 timing comparison and its record.** `870289d` (docs)
4. **Task 3: every registered mutant is killed on the final bytes.** `96c2df7` (docs)

## Files Created/Modified

- `scripts/run-tint-workload.js`: the `--source` flag, `readServedAssets(source)`, and `identity.source`. The judges are unchanged.
- `test/performance/tint-workload.js`: manifest-ordered injection, the two-read seam, and confirmation only once both reads have landed.
- `test/extension/performance-harness.test.js`: `--source` parse cases, plus negative controls for `timingJudgeSource`.
- `scripts/phase-04-source.js`: the harness is identified from Git, and `timingJudgeSource` holds the judging code to its committed text.
- `.planning/phases/07-upgrade-safe-foundation/07-PERFORMANCE.md`: the D-29 record.
- `07-PERFORMANCE-SAMPLES.json`: the seven working-tree runs, with `timingStatus` passed.
- `07-PERFORMANCE-BASELINE-SAMPLES.json`: the 0.1.0 30-enabled run, with `identity.source` set to baseline.
- `07-MUTATION-KILLS.jsonl`: 52 results and the final kill line.

## Decisions Made

- The timed source is df28338, the Task 1 commit. It was recorded with `git rev-parse HEAD` before the runs, and `extension/` was clean. The later commits touch only `.planning/`.
- The seam refuses any `storage.local.get` key form other than an array or an object. An unexpected read is then loud instead of looking like absence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The Phase 4 acceptance adapter pinned the working-copy timing harness bytes**
- **Found during:** Task 1
- **Issue:** `scripts/phase-04-source.js` required both harness files (`scripts/run-tint-workload.js`, `test/performance/tint-workload.js`) to be byte-identical in the working copy (`phase-04-evidence-uncommitted`). The plan requires editing both files and also requires `phase-04-live-acceptance.test.js` to pass, so the two requirements could not both hold.
- **Fix:**
  - The harness blobs at the observation revision are still hashed against `05-BASELINE.json`, and the aggregate harness hash still has to match. This is how the same file already treated the validator.
  - The reason the pin existed was that `validateWorkloadReport`, imported from the working copy, decides the historical verdict. That concern is now held directly: the judging code (OPERATIONS, requireValue, finite, summarizeSamples, validateWorkloadReport, mergeReport) must equal its committed text, otherwise the adapter rejects with `phase-04-timing-judge-changed`.
  - New negative controls show that editing a budget, an operation or the merge changes the compared text, and that a missing judge is refused.
  - This went in its own commit with the reason written out, following D-25.
- **Files modified:** scripts/phase-04-source.js, test/extension/performance-harness.test.js
- **Verification:** the Phase 3 and Phase 4 acceptance suites and the harness suite pass (163 tests). The full suite passes.
- **Committed in:** 2441c64

**2. [Rule 1 - Plan verify inaccuracy] The smoke check as written could not pass**
- **Found during:** Task 1
- **Issue:** The runner's stdout begins with a `TINT WORKLOAD SMOKE: passed` line, so `require()` on that file cannot parse it. A smoke run also reports `status: smoke_passed`, which is the existing contract, not `passed`.
- **Fix:** I ran the same predicate after stripping the header line, accepting `smoke_passed`. I also added two checks: the working-tree hashes equal the files on disk, and the baseline hashes equal `release/candidate.json`. The runner is unchanged.
- **Verification:** `SMOKE_BOTH_SOURCES_PASSED`, with four working-tree assets and three baseline assets.

**3. [Rule 3 - Environment] Temporary paths**
- **Issue:** The unsandboxed runner commands get a different `$TMPDIR` (`/var/folders/...`) from the sandboxed shell (`/tmp/claude-501`).
- **Fix:** The timing outputs went to absolute paths in the session scratchpad, which both shells can read.
- **Also:** The mutation run used `npm run --silent`, so npm's banner lines did not end up in the JSONL.

---

**Total deviations:** 3 (1 blocking evidence-tooling fix, 1 plan-verify correction, 1 environment path).
**Impact on plan:** None of these changed the shipped bytes, a budget, a judge or a mutant. The Phase 4 evidence guard is narrowed to the code that decides historical verdicts, and the harness is still identified from Git.

## Issues Encountered

- In Task 2, a zsh loop did not word-split its arguments. Six runner invocations exited at argument parsing (`Missing value for --mode`). They never started Chrome and wrote no output. The six runs then went ahead immediately with explicit arguments, in the planned order and in the same session. No run was repeated and no sample was discarded. This is recorded in 07-PERFORMANCE.md.
- Both absolute medians are above the v1 figures because this is a different machine (Apple M4, not M5 Max) and a different Chrome build. That is exactly the drift D-29's same-session design removes.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Phase 7's closing evidence is complete: the parity and contract suites pass, the 52 mutants are killed, and D-29 passed, all on the same bytes. This was the last plan in the phase. It is ready for phase verification, with review and repair capped at one round (D-31).
- The upgrade-in-place live check stays on the Phase 11 release-candidate checklist (D-28).

## Self-Check: PASSED

- The created files exist: 07-PERFORMANCE.md, 07-PERFORMANCE-SAMPLES.json, 07-PERFORMANCE-BASELINE-SAMPLES.json and 07-MUTATION-KILLS.jsonl.
- The commits exist: 2441c64, df28338, 870289d and 96c2df7.
- The re-run checks pass: TIMING_RECORD_COMPLETE, the kill line, a `git diff df28338 HEAD -- extension` that prints nothing, and test:recon exiting 0.
