---
phase: 01-dom-recon-spike
plan: 03
subsystem: testing
tags: [vitest, happy-dom, sanitizer, dom-fixtures, sha256, privacy]

requires:
  - phase: 01-dom-recon-spike/01-01
    provides: Fail-closed sensitive scanner, offline recon gate, and unresolved live-evidence ledger
  - phase: 01-dom-recon-spike/01-02
    provides: Explicit human approval for vitest@4.1.11 and happy-dom@20.13.1
provides:
  - Exact pinned Vitest and Happy DOM development toolchain with combined recon test command
  - One-way fail-before-write sanitizer for private table-container captures
  - Non-vacuous manifest contract for checksums, detached parsing, selectors, and three scenario invariants
affects: [01-04, 01-05, fixture-admission, selector-recon]

actuals:
  tokens: 21182
  tasks: 2
  commits: 5

tech-stack:
  added: [vitest@4.1.11, happy-dom@20.13.1]
  patterns: [exact-version dev dependencies, one-way sanitization, fail-before-write validation, detached DOM parsing, final-byte provenance]

key-files:
  created:
    - package.json
    - package-lock.json
    - vitest.config.js
    - scripts/sanitize-fixture.js
    - test/recon/sanitize-fixture.test.js
    - test/recon/fixture-contract.test.js
  modified:
    - .gitignore
    - test/recon/sensitive-patterns.js

key-decisions:
  - "Construct detached parsers from an isolated Happy DOM Window with script, stylesheet, image, and navigation loading disabled."
  - "Keep capture-specific denylist values ephemeral: sanitize with the private list, then use the shared generic scan plus exact checksums for later corpus revalidation."
  - "Require manifest fixture paths to remain relative to and contained within the manifest directory."
  - "Refuse to overwrite an existing output so a sanitized admission is always a new, separate artifact."

patterns-established:
  - "Sanitizer boundary: canonicalize paths, reject in-worktree input and active/resource-bearing markup, preserve only narrow structural attributes, replace content deterministically, scan final bytes, then write once."
  - "Corpus contract: checksum and sensitive scan precede detached parsing; declared table/header selectors and scenario-specific assertions must all succeed."

requirements-completed: [RECON-01, RECON-02, RECON-03]

coverage:
  - id: D1
    description: "Only vitest@4.1.11 and happy-dom@20.13.1 are installed as exact development dependencies, with no production dependencies."
    requirement: RECON-01
    verification:
      - kind: integration
        ref: "01-03-PLAN.md Task 1 exact package contract command"
        status: pass
    human_judgment: false
  - id: D2
    description: "Private capture input is transformed through a one-way, fail-before-write sanitizer that retains table topology and only the four English priority labels."
    requirement: RECON-01
    verification:
      - kind: unit
        ref: "test/recon/sanitize-fixture.test.js#sanitizeFixture"
        status: pass
      - kind: integration
        ref: "npm run test:recon"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fixture manifests enforce final-byte SHA-256, sensitive scanning, detached parsing, table/header selectors, and non-vacuous three-scenario invariants."
    requirement: RECON-03
    verification:
      - kind: unit
        ref: "test/recon/fixture-contract.test.js#fixture corpus contract"
        status: pass
      - kind: integration
        ref: "GSD_FIXTURE_MANIFEST=/tmp/zhroma-manifest-does-not-exist.json vitest (expected fail-closed result)"
        status: pass
    human_judgment: false

duration: 13 min
completed: 2026-09-03
status: complete
---

# Phase 01 Plan 03: DOM Sanitizer and Corpus Contract Summary

**Exact approved test tooling, a one-way topology-preserving sanitizer, and a provenance-bound detached-DOM fixture admission contract**

## Performance

- **Duration:** 13 min resumed execution
- **Started:** 2026-09-03T09:30:19Z
- **Completed:** 2026-09-03T09:44:04Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Installed and locked only the separately approved `vitest@4.1.11` and `happy-dom@20.13.1` development dependencies, with the original Node smoke suite and new Vitest contracts sharing one `test:recon` command.
- Built `sanitizeFixture()` as a one-way boundary: raw input must remain outside Git, output must be separate and new, active/resource-bearing markup fails before parsing, structural attributes survive, and all non-priority content is replaced deterministically before the final sensitive scan and write.
- Added a non-vacuous fixture contract that verifies final bytes, bounded relative paths, provenance metadata, detached inert parsing, declared selectors, and the exact Priority-present, Priority-absent, and grouped/long scenario semantics.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install only the approved exact test toolchain** - `eabdfae` (chore)
2. **Task 2 RED: Add failing sanitizer and corpus contracts** - `41989f7` (test)
3. **Task 2 GREEN: Complete the one-way sanitizer and corpus contract** - `07538ed` (feat)

## Files Created/Modified

- `.gitignore` - Keeps the installed `node_modules/` tree outside the repository.
- `package.json` - Defines the ESM project, combined recon test command, and exactly two approved development dependencies.
- `package-lock.json` - Records the npm-generated exact dependency graph.
- `vitest.config.js` - Runs `test/recon/*.test.js` in Happy DOM.
- `scripts/sanitize-fixture.js` - Provides the bounded one-way sanitizer, SHA-256 helper, and non-disclosing CLI.
- `test/recon/sensitive-patterns.js` - Extends the shared gate to reject frames and every resource-bearing attribute, including relative references.
- `test/recon/sanitize-fixture.test.js` - Covers deterministic transformation, path boundaries, denial cases, no-overwrite behavior, and CLI disclosure controls.
- `test/recon/fixture-contract.test.js` - Provides and exercises manifest validation over temporary safe corpora and the `GSD_FIXTURE_MANIFEST` admission interface.

## Decisions Made

- A Happy DOM `DOMParser` is created from an isolated `Window`; JavaScript, script/CSS/image loading, and navigation are disabled in addition to rejecting dangerous markup before parse.
- Capture-specific values never enter the manifest. The sanitizer applies the private denylist before output, while later immutable-corpus checks repeat the generic scanner and bind the result to final-byte SHA-256.
- The manifest uses explicit scenario assertions. Priority-present must declare all four exact labels; Priority-absent must prove the column selector absent; grouped/long must prove distinct group-row, sticky/duplicate-header, and scroll-container topology.
- Inputs are capped at 5 MiB and denylists at 64 KiB before reads; existing output is never overwritten.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added the dependency-tree ignore boundary**
- **Found during:** Task 1
- **Issue:** Installing approved packages creates `node_modules/`, but the plan's file list omitted the repository ignore rule needed to keep generated dependency bytes out of Git.
- **Fix:** Added `.gitignore` with `node_modules/`.
- **Files modified:** `.gitignore`
- **Verification:** `git status --short` shows no dependency-tree files.
- **Committed in:** `eabdfae`

**2. [Rule 2 - Missing Critical] Contained manifest file reads**
- **Found during:** Task 2
- **Issue:** A manifest-controlled filename could otherwise traverse outside the corpus directory.
- **Fix:** Require relative, contained fixture paths and reject duplicates before admission.
- **Files modified:** `test/recon/fixture-contract.test.js`
- **Verification:** Path-traversal and duplicate-provenance tests pass.
- **Committed in:** `07538ed`

**3. [Rule 2 - Missing Critical] Bounded untrusted input before reading**
- **Found during:** Task 2 threat-model review
- **Issue:** A table-boundary check after an unbounded read would not adequately mitigate sanitizer input denial of service.
- **Fix:** Enforce a 5 MiB capture limit and 64 KiB denylist limit from file metadata before loading bytes.
- **Files modified:** `scripts/sanitize-fixture.js`, `test/recon/sanitize-fixture.test.js`
- **Verification:** Empty/out-of-bounds inputs fail before parse or output; the full recon suite passes.
- **Committed in:** `07538ed`

---

**Total deviations:** 3 auto-fixed (3 missing-critical safeguards).
**Impact on plan:** The additions close generated-file, path-traversal, and resource-exhaustion gaps without expanding the product scope.

## Issues Encountered

- The initial Task 1 commit was denied by the workspace Git-index sandbox; the same normal commit succeeded after the scoped Git approval, with hooks enabled and no unrelated files staged.
- Happy DOM 20.13.1 requires `DOMParser` to be obtained from a `Window`; direct construction from the package export failed. The implementation now uses an isolated, loading-disabled window as required by the security boundary.
- Vitest represents module URLs through its browser environment, so a `fileURLToPath(import.meta.url)` root check was invalid. The sanitizer now walks upward from the execution directory to an actual `.git` boundary and fails closed when none exists.

## TDD Gate Compliance

- **RED:** `41989f7` records the sanitizer suite failing because `scripts/sanitize-fixture.js` did not exist, while all eight fixture-contract self-tests passed.
- **GREEN:** `07538ed` implements the sanitizer and shared policy updates; the final run passes 17 Node smoke tests and 29 Vitest tests.

## Known Stubs

None. The only scan match for `placeholder` is the intentionally stripped HTML `placeholder` attribute name, not incomplete behavior.

## Threat Flags

None. All new file-access and detached-parse surfaces were planned and are covered by containment, checksum, scan-before-parse, loading-disabled Window, and fail-before-write controls.

## User Setup Required

None - no external service configuration is required.

## Next Phase Readiness

- Plan 01-04 can use the prepared authenticated three-tab session for read-only live DOM reconnaissance.
- Plan 01-05 can pass each private bounded capture through the sanitizer and validate the admitted three-file manifest using `GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon`.
- No live fixture has been admitted yet, and the shared RECON requirements remain pending until the later plans produce terminal live evidence and a final verdict.

## Self-Check: PASSED

All eight task-owned files exist; commits `eabdfae`, `41989f7`, and `07538ed` are present; the exact package contract passes; 17 Node smoke tests and 29 Vitest tests pass; and no generated dependency tree or raw capture is tracked.

---
*Phase: 01-dom-recon-spike*
*Completed: 2026-09-03*
