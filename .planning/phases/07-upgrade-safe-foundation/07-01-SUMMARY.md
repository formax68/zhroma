---
phase: 07-upgrade-safe-foundation
plan: 01
subsystem: testing
tags: [parity, happy-dom, vitest, contract, git-blobs, mv3]

requires:
  - phase: 05-published
    provides: release/candidate.json binding 0.1.0 to revision 6d3ab0b and its twelve asset hashes
  - phase: 04-honest-failure-and-an-off-switch
    provides: strict Chrome harness, get-status diagnoses, mutation sequences
provides:
  - scripts/baseline-source.js, a pinned 0.1.0 blob reader cross-checked against release/candidate.json
  - test/extension/parity.test.js, a differential 0.1.0 parity harness (18 scenarios x 3 upgrade states)
  - test/extension/frozen-contract.test.js, frozen permission, exposure, network, sync, url( and importScripts invariants
  - test/extension/runtime-contract.test.js, labelled as the versioned v1.0 pins, plus the per-file Chrome API allowlist
affects: [07-upgrade-safe-foundation, 08-themes, 09-colouring-rules, 10-rule-editor, 11-release]

actuals:
  tokens: 9900
  tasks: 3
  commits: 3
plan_head_before: 13d91e3129ab2e905175b0a98d0ec55e893990ce
plan_head_after: 8e9373b79d0ebb031d6bb78faf1e8e888e7b25a7

tech-stack:
  added: []
  patterns:
    - "Differential parity: each side runs from its own manifest; the 0.1.0 side comes only from pinned Git blobs"
    - "Frozen contract over a discovered tree, with every pattern proven against a synthetic violation in the same test"

key-files:
  created:
    - scripts/baseline-source.js
    - test/extension/parity.test.js
    - test/extension/frozen-contract.test.js
  modified:
    - test/extension/runtime-contract.test.js

key-decisions:
  - "The parity matrix has 18 scenarios: the 17 the plan named plus 'English regional shell' (en-GB, the CR-01 behaviour), which makes the plan's 18-scenario count concrete"
  - "The baseline reader also rejects a blob whose byte length differs from the candidate's recorded size, under baseline-asset-mismatch"
  - "The frozen page-exposure list is web_accessible_resources, externally_connectable, content_security_policy and update_url; content_scripts additionally may not gain exclude_matches, include_globs, match_about_blank or match_origin_as_fallback"
  - "The Chrome API allowlist pins 13 paths for background.js, 6 for content.js and 1 for popup.js, forbids computed chrome[...] access, and requires any other shipped script that names chrome.* to join the list"

patterns-established:
  - "Baseline side: side.read(path) returns baseline.files[path] from readBaselineSource(); never extension/ on disk"
  - "Parity case names are '<scenario> under <state>' and stay stable for later mutants"

requirements-completed: [COMPAT-01, COMPAT-03, COMPAT-04]

coverage:
  - id: D1
    description: "Pinned 0.1.0 blob reader that refuses a tampered candidate record (revision, asset hash, inventory, digest, shape)"
    requirement: COMPAT-01
    verification:
      - kind: unit
        ref: "test/extension/parity.test.js#the baseline reader refuses %s (%s)"
        status: pass
      - kind: other
        ref: "node --input-type=module -e \"import {readBaselineSource} from './scripts/baseline-source.js'; ...\" prints 12 6d3ab0b10e9419a5c1077e59e468977c00d59d4a"
        status: pass
    human_judgment: false
  - id: D2
    description: "Differential parity of markers, get-status diagnosis and computed cell backgrounds across 18 scenarios and 3 upgrade states, including the sorted equal-priority ordering edge"
    requirement: COMPAT-01
    verification:
      - kind: integration
        ref: "test/extension/parity.test.js#%s under %s (54 cases)"
        status: pass
      - kind: integration
        ref: "test/extension/parity.test.js#the baseline traces are not vacuous: they tint, paint and reach every product diagnosis"
        status: pass
      - kind: integration
        ref: "test/extension/parity.test.js#negative control: a one-character palette change is reported as a difference"
        status: pass
      - kind: integration
        ref: "test/extension/parity.test.js#negative control: a detector that no longer recognises Low is reported as a difference"
        status: pass
    human_judgment: false
  - id: D3
    description: "COMPAT-04 ordering edge: rows sharing a priority in a sorted view keep the same order, markers and backgrounds"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/parity.test.js#sort with equal priorities under fresh install|upgraded, off|upgraded, on"
        status: pass
    human_judgment: false
  - id: D4
    description: "Frozen contract: D-01 permission surface, no page exposure, no network or remote code, no sync area, stylesheets load nothing, packaged-only importScripts"
    requirement: COMPAT-03
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js (7 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Versioned v1.0 pins header and the per-file Chrome API allowlist, landed in a test-only commit"
    requirement: COMPAT-03
    verification:
      - kind: unit
        ref: "test/extension/runtime-contract.test.js#the Chrome API allowlist is exactly the v1.0 surface of each shipped script"
        status: pass
      - kind: other
        ref: "git diff-tree of 8e9373b lists only test/extension/ paths"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 01: Parity Harness and Frozen Contract Summary

**A git-blob-pinned 0.1.0 baseline reader, a 54-case differential parity harness (markers, diagnoses, computed backgrounds) that the working tree passes byte-for-byte, and a frozen contract separated from the versioned v1.0 pins.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-09-28T08:08:07Z
- **Completed:** 2026-09-28T08:16:00Z
- **Tasks:** 3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `readBaselineSource()` serves the twelve 0.1.0 blobs from revision `6d3ab0b` only after checking the literal revision against `release/candidate.json`, the tracked inventory, every blob's size and sha256, and the aggregate digest. It reads nothing under `extension/` or `.planning/`.
- `parity.test.js` runs both sides from their own manifests under the strict Chrome harness. It compares every step of 18 scenarios under fresh install, upgraded off and upgraded on. The two negative controls (CSS `0.14` changed to `0.13`, content.js without `Low`) both register as differences. The non-vacuity check confirms that the baseline traces tint, paint, and reach `working`, `missing` and `cannot-read`.
- `frozen-contract.test.js` guards the D-01 surface and the D-26/D-27 invariants over the discovered tree. Each pattern is shown to catch a synthetic violation.
- `runtime-contract.test.js` is labelled as the versioned v1.0 pins and gains the Chrome API allowlist test. No existing test changed.

## Task Commits

1. **Task 1: End-to-end parity of one fixture (tracer)** - `7196a8b` (feat)
2. **Task 2: Full parity matrix, upgrade states and negative controls** - `645e8f4` (test)
3. **Task 3: Split the contract into frozen invariants and versioned v1.0 pins** - `8e9373b` (test, touches only test/extension/)

The tracer feedback gate ran in interactive end-of-phase mode with an automated-only verify. It re-ran the verify, which passed, so the plan continued to expansion.

## Files Created/Modified
- `scripts/baseline-source.js` - Pinned 0.1.0 blob reader. Exports `BASELINE_REVISION`, `CANDIDATE_PATH`, `BaselineSourceError` and `readBaselineSource`.
- `test/extension/parity.test.js` - `STATES`, `SCENARIOS`, `trace(side, scenario, state)`, the tamper controls, the non-vacuity check and the negative controls.
- `test/extension/frozen-contract.test.js` - Frozen invariants and the `importScripts` argument helper.
- `test/extension/runtime-contract.test.js` - Versioned-pins header and `the Chrome API allowlist is exactly the v1.0 surface of each shipped script`.

## Decisions Made
- An 18th scenario, `English regional shell` (`lang: 'en-GB'` plus a re-render), was added so the plan's stated count of 18 scenarios is real. The plan named 17 operations.
- Some scenarios gained a return leg so the recovery path is also compared: `view switch` goes absent and then back to present, `non-English shell` switches `lang` back to `en` with an attributes record, and `unknown priority value` restores `Urgent`.
- The baseline reader also checks each blob's byte length against the candidate's `size`, and uses `git cat-file -e` to detect a missing revision.
- The Chrome API allowlist was derived from `grep -o 'chrome\.[A-Za-z.]*'` over the three scripts, and every entry was checked at its call site. None comes from a comment.

## Deviations from Plan

**1. [Rule 3 - Blocking] The HEAD safety assertion reported `main` as protected**
- **Found during:** the first commit (Task 1)
- **Issue:** `git.base-branch --is-protected main` returned `true`, and `main` is the only branch.
- **Resolution:** The orchestrator told this executor to run sequentially on the main working tree with normal commits. The project config sets `git.branching_strategy: "none"`, and every earlier plan committed to `main`. HEAD had not drifted, so the commits went to `main`. No config was changed. If the orchestrator wants these commits on a phase branch, that is a follow-up for it to decide.

**2. [Scope] 18th scenario and return legs**, as described under Decisions Made. The trace and snapshot shape are exactly as specified.

---

**Total deviations:** 1 procedural, 1 scope clarification
**Impact on plan:** None on the deliverables. No file under `extension/` changed.

## Issues Encountered
- happy-dom returns `""`, not `rgba(0, 0, 0, 0)`, as the computed background of an untinted cell. This was measured, and the `tinted` predicate treats both as untinted.
- The `startup on grouped-long` fixture reports `cannot-read/structure` as shipped, because its redaction placeholders are not Priority labels. Parity holds in that state. The scenarios that need tinted grouped rows set their Priority text first, as persistent-tint.test.js does.

## Verification
- `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/parity.test.js`: 65 passed (54 matrix cases, 5 tamper controls, the tracer, the inventory, the matrix-shape check, non-vacuity and 2 negative controls)
- `... test/extension/frozen-contract.test.js test/extension/runtime-contract.test.js`: 30 passed
- `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon`: 110 node smoke tests and 1239 Vitest tests passed across 28 files
- `test -z "$(git status --porcelain -- extension)"`: exit 0
- The contract commit `8e9373b` touches only `test/extension/frozen-contract.test.js` and `test/extension/runtime-contract.test.js`
- `git diff 6140bcc -- test/extension/runtime-contract.test.js` removes no `test(` line

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- Every later Phase 7 plan can use `parity.test.js` and `frozen-contract.test.js` as its regression check. Both are green on today's bytes.
- Once the shared settings file is prepended to `content_scripts[0].js`, the working side will pick it up automatically from the working manifest.
- When `zhroma-settings.js` lands, the Chrome API allowlist must be restated in its own commit, and that includes `importScripts` in background.js if the worker loads it.

## Self-Check: PASSED
- FOUND: scripts/baseline-source.js, test/extension/parity.test.js, test/extension/frozen-contract.test.js, test/extension/runtime-contract.test.js
- FOUND commits: 7196a8b, 645e8f4, 8e9373b

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
