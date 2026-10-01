---
status: diagnosed
trigger: "UAT gap G-07-4a (Phase 07 test 4, WR-01): The Phase 4 timing-judge guard cannot be bypassed by code outside the pinned judge slices"
created: 2026-10-01T17:00:00Z
updated: 2026-10-01T17:20:00Z
goal: find_root_cause_only
symptoms_prefilled: true
---

## Current Focus

bug_class: Bohrbug (deterministic, latent guard weakness - reproduces every time an out-of-slice statement is present)
hypothesis: CONFIRMED - timingJudgeSource() pins only text slices while the live-acceptance tests execute the working-copy runner module, so out-of-slice top-level code alters historical verdicts with identical slice text
test: done - 4 scratch mutants in $TMPDIR/wr01, slice-text equality true for all, verdicts changed for all under working-copy import
expecting: n/a
next_action: return ROOT CAUSE FOUND to orchestrator (goal find_root_cause_only); plan-phase --gaps owns the fix
candidate_causes:
  - "code: execution path imports judges from working copy (confirmed)"
  - "code/design: guard compares text subset, not behaviour (confirmed)"
  - "environment: host-realm built-in prototypes reachable from a VM judge via host-realm input arrays (confirmed - constrains the fix)"
  - "data: historical samples tampered (ruled out - evidence_hashes pin 04-PERFORMANCE-SAMPLES.json; all 13 runs judge passed under pinned judges)"
and_gate: "yes - the bypass needs BOTH (a) judges executed from the working-copy module and (b) a guard that only compares text slices; and a VM fix needs BOTH (c) pinned code in a fresh context and (d) inputs created in that context"

## Symptoms

expected: Before commit 2441c64, scripts/run-tint-workload.js had to be byte-identical to its pinned blob, so no edit to it could change how the Phase 3/4 human-observed timing samples are judged.
actual: 2441c64 narrowed scripts/phase-04-source.js timingJudgeSource() to compare only text slices (first line of OPERATIONS, requireValue, finite, three export function bodies). Top-level statements elsewhere in run-tint-workload.js (e.g. `OPERATIONS.length = 0;` or `Math.ceil = () => 1;`) change judge results while timingJudgeSource(mutated) === timingJudgeSource(original). Phase-03/phase-04 live-acceptance tests import validateWorkloadReport from the working copy.
errors: None reported. Today's bytes contain no such statement; latent guard weakness.
reproduction: UAT test 4 (07-UAT.md); WR-01 in 07-REVIEW.md
started: commit 2441c64 (07-09); discovered in code review, confirmed for fixing in UAT 2026-10-01

## Eliminated

## Evidence

- timestamp: 2026-10-01T17:05:00Z
  checked: scripts/phase-04-source.js L137-168 (timingJudgeSource) and L229-231 (the only judge guard in readPhase04Source)
  found: timingJudgeSource keeps only 3 single lines (lines starting `const OPERATIONS = `, `const requireValue = `, `const finite = `) plus the three `export function` bodies (each up to the next line matching /^(export |async function |function |const |let |if \()/). readPhase04Source only asserts timingJudgeSource(pinned blob) === timingJudgeSource(working copy); it returns no judge, and nothing ever executes the pinned text.
  implication: The guard is a text-equality tripwire on a subset of the file. Execution still happens in the working-copy module, so any statement outside the subset that runs at module evaluation can change judge behaviour.

- timestamp: 2026-10-01T17:06:00Z
  checked: grep across test/ and scripts/ for validateWorkloadReport / summarizeSamples / mergeReport / readPhase04Source / timingJudgeSource
  found: Working-copy judge importers: test/extension/phase-04-live-acceptance.test.js:35 (used L350 on historical 04-PERFORMANCE-SAMPLES runs), test/extension/phase-03-live-acceptance.test.js:7 (used L126 on historical 03-PERFORMANCE-SAMPLES runs; this file never calls readPhase04Source, so it is not even behind the text tripwire within its own module graph), test/extension/performance-harness.test.js:5 (unit tests of the CURRENT harness - legitimately the working copy). readPhase04Source users: phase-04-live-acceptance.test.js L77, L703, L737, L752, L769. scripts/release-evidence.js:27 imports only readBaseline. No test/recon file touches the judges.
  implication: Two historical verdict paths (Phase 3 and Phase 4 samples) are decided by working-copy code.

- timestamp: 2026-10-01T17:07:00Z
  checked: diff of git blob 47702660:scripts/run-tint-workload.js vs working copy
  found: Differences are all outside the slices - new `import { readBaselineSource } from './baseline-source.js'`, ASSETS -> SOURCES/ASSET_NAME, parseArguments --source, new readServedAssets, runWorkload source wiring. Pinned and working slice texts are equal today.
  implication: Today's bytes are sound; the weakness is latent. The added import is one more out-of-slice module whose evaluation precedes the judges.

- timestamp: 2026-10-01T17:08:00Z
  checked: git show 2441c64 (07-09)
  found: Replaced requirePinnedEvidence(baseline, path, ...) for both timing_harness_files (byte-identical working copy) with Git-only hash checks plus the judge-text equality. Negative controls added in performance-harness.test.js L127-139 only mutate text inside slices (median budget, OPERATIONS first element, mergeReport message, de-exporting mergeReport, renaming finite).
  implication: Root-cause commit confirmed; no negative control covers an out-of-slice mutation.

- timestamp: 2026-10-01T17:09:00Z
  checked: fix constraints - phase-04-live-acceptance.test.js L740-753, 07-CONTEXT D-06/D-23/D-25/D-26/D-31, verify-mutation-kills.js L68, vitest.config.js, package.json
  found: (a) phase-04 test asserts the adapter contains exactly ONE `readFileSync(` and no `catch { return readFileSync` / `|| readFileSync`; (b) D-26 "frozen" file is test/extension/frozen-contract.test.js (WR-06 territory), not any file in this path; (c) D-25: an assertion in an existing v1 test may change only in its own commit with a written reason; D-06 contract-test changes in their own commit; (d) D-23: no new dependency in Phase 7 (node:vm is a builtin, fine); (e) D-31: one repair round; (f) verify-mutation-kills forbids phase-04-live-acceptance.test.js as a mutant target suite; (g) baseline validator_sha256 is checked against the Git blob only - the working copy of phase-04-live-acceptance.test.js is explicitly editable (adapter comment L203-206); (h) performance-harness.test.js already imports createContext/Script from node:vm (precedent).
  implication: A vm-based fix in scripts/phase-04-source.js (no new disk read) plus test edits in phase-03/phase-04 live-acceptance and performance-harness tests is permitted, provided assertion changes are committed separately with reasons.

- timestamp: 2026-10-01T17:15:00Z
  checked: Scratch reproduction in $TMPDIR/wr01 (probe.mjs + make.mjs; nothing written to repo). Each mutant = working-copy runner + one out-of-slice statement, run in its own node process; judged three ways - working-copy import (today's tests), reviewer's VM sketch with main-realm inputs, VM with inputs JSON-parsed inside the context.
  found: |
    timingJudgeSource(mutant) === timingJudgeSource(original) is TRUE for every mutant.
    control: all three judges agree on 3 crafted runs + 13 historical runs (7 Phase 4, 6 Phase 3) -> pinned slices are self-contained and run unchanged in createContext({}) with codeGeneration {strings:false, wasm:false}.
    M1 `OPERATIONS.length = 0;` after `const finite`: working copy says passed for over-max (20 ms) and over-median runs (should be gaps_found). VM (both variants) -> gaps_found. Bypass confirmed; VM defeats it.
    M2 `Math.ceil = () => 1;` before readServedAssets: working copy says passed for over-median run. VM (both) -> gaps_found. Bypass confirmed; VM defeats it.
    M3 `Array.prototype.sort = function () { return this; };`: working copy AND reviewer's VM sketch (main-realm input) say passed for the over-max run; only JSON-marshalled VM says gaps_found.
    M4 `Array.prototype.at = function () { return 99; };`: working copy AND reviewer's VM sketch flip every historical enabled run (p4 30/200/1000, p3 30/200/1000) to gaps_found; only JSON-marshalled VM keeps them passed.
  implication: Root cause reproduced. The reviewer's proposed fix (run pinned slices in a fresh VM) is necessary but NOT sufficient if the judges receive host-realm arrays - `samples.map(...)`, `.sort`, `.at`, `.every`, `.reduce`, `.filter` dispatch to the caller's Array.prototype. Inputs must be created inside the context (e.g. JSON text parsed by a context-realm JSON.parse) and/or the acceptance tests must stop importing the runner so its top-level code never evaluates in their realm.

- timestamp: 2026-10-01T17:17:00Z
  checked: Phase 3 judge provenance - timingJudgeSource on blob 382cc88 (Phase 3 HISTORICAL_REVISION) vs 47702660 (Phase 4 pin); verdicts of both on 03-PERFORMANCE-SAMPLES.json in a VM
  found: Slice texts differ (04-09 commits efc385f, 43cfb4a added dormant mode), but both judges return passed for all six Phase 3 enabled/disabled runs. phase-03-live-acceptance.test.js never calls readPhase04Source, so within its own module graph nothing checks the judge text at all.
  implication: Phase 3 test can be served the Phase 4 pinned judges (today's effective behaviour) without moving its verdict.

- timestamp: 2026-10-01T17:18:00Z
  checked: vitest 4.1.11 configDefaults; vitest.config.js; baseline run of the 3 affected test files; tsconfig include; release-evidence.js import
  found: isolate: true (default, not overridden) -> each test file has its own module graph/realm, so performance-harness.test.js importing the runner cannot patch built-ins seen by the acceptance tests once they stop importing it. Baseline: 3 files, 163 tests passed (PHASE 03/04 STATUS human_needed). tsconfig covers only extension/zhroma-settings.js + types; scripts/ is not type-checked. scripts/release-evidence.js imports only readBaseline from the adapter.
  implication: No type-check constraint on the adapter change; readBaseline export and side-effect-free import must be preserved.

## Resolution

root_cause: |
  Commit 2441c64 (07-09) replaced the byte-identical pin of scripts/run-tint-workload.js with a text-equality tripwire over a subset of the file (scripts/phase-04-source.js L139-168, L229-231), but left EXECUTION of the judges in the working-copy module: test/extension/phase-04-live-acceptance.test.js:35/350 and test/extension/phase-03-live-acceptance.test.js:7/126 import validateWorkloadReport from ../../scripts/run-tint-workload.js. Any top-level statement outside the slices (or in the runner's imports fixture-contract.js / baseline-source.js, or patching built-ins) runs at module evaluation and changes the historical verdict while timingJudgeSource(pinned) === timingJudgeSource(working). Reproduced with four mutants (OPERATIONS.length = 0; Math.ceil; Array.prototype.sort; Array.prototype.at). The Phase 3 test is not behind even the tripwire in its own module graph. Secondary (fix-design) finding: the reviewer's VM sketch alone does not close the hole if host-realm arrays are passed in - prototype patches (M3, M4) still reach the pinned judge; inputs must be built inside the context.
fix: (not applied - goal find_root_cause_only; handed to plan-phase --gaps)
verification: (n/a - diagnose only)
files_changed: []
