---
phase: 01-dom-recon-spike
plan: 05
subsystem: testing
tags: [zendesk, dom-recon, sanitization, happy-dom, vitest, fixtures]

requires:
  - phase: 01-dom-recon-spike/01-04
    provides: authenticated static and post-sort/refresh DOM evidence plus the completed human interaction seam
provides:
  - terminal English-path evidence ledger with an explicit downstream block verdict
  - sanitized live-derived Priority-present, Priority-absent, and grouped-long fixture corpus
  - checksum-bound manifest with detached-DOM scenario assertions
affects: [phase-02, selector-strategy, userscript-runtime, fixture-regression-tests]

actuals:
  tokens: 18295
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - one-way in-page structural projection before the repository sanitizer
    - exact-byte fixture admission with fail-closed final verdict validation

key-files:
  created:
    - test/fixtures/zendesk-view-priority-present.html
    - test/fixtures/zendesk-view-priority-absent.html
    - test/fixtures/zendesk-view-grouped-long.html
    - test/fixtures/manifest.json
  modified:
    - SELECTORS.md
    - scripts/verify-recon-gate.js
    - test/recon/fixture-contract.test.js
    - test/recon/recon-gate.smoke.js

key-decisions:
  - "Phase 2 remains closed: the corpus and static DOM gates pass, but native hover/selection tint composition was not evidenced."
  - "The grouped-long contract accepts the observed same-table sticky header as well as a possible separate duplicate header."
  - "Garden identifiers remain the winning selector family, paired with test identifiers; exact English text is the only observed Priority-value fallback."

patterns-established:
  - "Private capture boundary: project a bounded live table to allowlisted structure, run the repository sanitizer with a capture-specific denylist, then delete the private input."
  - "Evidence gate: all English-path ledger entries must be terminal, and final mode binds its verdict to the exact three-fixture manifest."

requirements-completed: [RECON-01, RECON-02, RECON-03]

coverage:
  - id: D1
    description: Three live-derived sanitized fixtures cover Priority present, Priority absent, and grouped long table shapes.
    requirement: RECON-01
    verification:
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon"
        status: pass
    human_judgment: false
  - id: D2
    description: Every English-path ledger entry has terminal evidence, interpretation, fallback, and named scenario coverage.
    requirement: RECON-02
    verification:
      - kind: unit
        ref: "node scripts/verify-recon-gate.js evidence SELECTORS.md"
        status: pass
    human_judgment: false
  - id: D3
    description: The two terminal DOM risks are answered and the downstream verdict is explicit.
    requirement: RECON-03
    verification:
      - kind: integration
        ref: "node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json"
        status: pass
    human_judgment: false

duration: 26min
completed: 2026-09-03
status: complete
---

# Phase 1 Plan 5: Fixture Admission and Verdict Summary

**A checksum-bound three-scenario Zendesk table corpus with terminal English DOM evidence and a fail-closed Phase 2 block verdict.**

## Performance

- **Duration:** 26 min
- **Started:** 2026-09-03T11:51:44Z
- **Completed:** 2026-09-03T12:18:07Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Captured three bounded live table shapes through a one-way in-page projection, admitted only sanitized structural bytes, and removed every private capture input after sanitization.
- Bound each fixture to exact SHA-256 bytes, detached parsing, selectors, sensitive scanning, and non-vacuous Priority-present, Priority-absent, group-row, same-table-sticky-header, and scroll-container assertions.
- Closed every English-path ledger entry and issued an explicit `block` verdict because the user-controlled sequence did not leave hover or selected-row paint evidence sufficient to validate tint composition.

## Task Commits

Each task was committed atomically:

1. **Task 1: Complete interaction evidence and admit the three sanitized fixture variants** - `f14b363` (test)
2. **Task 2: Issue the evidence-derived proceed or block verdict** - `723b3f1` (docs)

## Files Created/Modified

- `SELECTORS.md` - Terminal live evidence, admitted-corpus record, winning selectors, paint owner, and explicit block verdict.
- `test/fixtures/zendesk-view-priority-present.html` - Sanitized canonical topology with Urgent, High, Normal, and Low rows.
- `test/fixtures/zendesk-view-priority-absent.html` - Sanitized control with the proven table/header and no Priority column.
- `test/fixtures/zendesk-view-grouped-long.html` - Sanitized grouped, scrollable, same-table-sticky-header topology.
- `test/fixtures/manifest.json` - Non-identifying provenance, selectors, assertions, and final-byte checksums.
- `scripts/verify-recon-gate.js` - Terminal-entry enforcement, required CLI markers, and manifest scenario/checksum binding.
- `test/recon/fixture-contract.test.js` - Contract support for the observed same-table sticky header.
- `test/recon/recon-gate.smoke.js` - Terminal ledger and fail-closed unresolved-question coverage.

## Decisions Made

- The final verdict is `block`, not `proceed`: static selector, Shadow DOM, scrolling, paint-owner, marker-replacement, and corpus gates pass, but hover/selection paint composition remains unproven.
- `data-garden-id` plus the paired `data-test-id` is the winning selector strategy. The paired test identifier is the first fallback; an identifier-free structural fallback has not been proven across the corpus.
- Priority parsing remains English-only because no machine-readable priority value was observed. Blank or unknown values must remain unreadable rather than inferred.
- The normal white surface is owned by `DIV[data-garden-id="pane"]`; any later tint must target only direct cells of positively matched ticket rows and exclude sticky headers and group rows.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the grouped-long topology contract to match the live same-table sticky header**
- **Found during:** Task 1
- **Issue:** The pre-existing fixture contract required a separate duplicate header table, while authenticated evidence proved the current shell uses sticky cells in the ticket table's own `THEAD`.
- **Fix:** Accepted either same-table sticky-header topology or a separate duplicate header while preserving the shared scroll-container and group-row ownership checks.
- **Files modified:** `test/recon/fixture-contract.test.js`
- **Verification:** The selected admitted corpus and the synthetic fixture contract both pass.
- **Committed in:** `f14b363`

**2. [Rule 2 - Missing Critical] Made the CLI gates enforce the Plan 05 terminal and manifest contract**
- **Found during:** Task 1
- **Issue:** Evidence mode previously allowed unresolved English questions and emitted neither `EVIDENCE READY` nor `FINAL VERDICT`; final mode did not bind the verdict to manifest scenarios and checksums.
- **Fix:** Rejected unresolved English questions in both modes, emitted the required deterministic markers, and validated the exact three-scenario manifest plus fixture hashes when final mode receives a manifest.
- **Files modified:** `scripts/verify-recon-gate.js`, `test/recon/recon-gate.smoke.js`
- **Verification:** Evidence, final, smoke, and complete corpus commands pass.
- **Committed in:** `f14b363`

**Inherited safety deviation from Plan 04:** An earlier native keyboard probe briefly navigated to a ticket and Browser Back immediately restored the source view. No ticket or account data was changed, no identifying content was persisted, and native keyboard injection was not used in Plan 05.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical gate) plus 1 inherited safety note.
**Impact on plan:** Both fixes were required for the live topology and fail-closed admission contract; no product implementation or authenticated mutation was added.

## Issues Encountered

- The sanitizer initially rejected its outputs because the new `test/fixtures/` directory did not yet exist. Creating the planned directory resolved the output precondition; the sanitizer was then rerun successfully without overwriting any file.
- The original Priority-absent tab was replaced by the user with a non-operational ungrouped Priority-absent view, as required by the blocking-human precondition. The replacement was inspected read-only and no operational view changed.
- Existing dirty `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/config.json`, `.planning/state.json`, `.gsd/`, and `.planning/milestone.lock` content was preserved and excluded from task commits.

## Authentication and Human Gates

- The user prepared the final non-operational ungrouped Priority-present view and confirmed no operational changes. Plan 05 then used read-only DOM inspection only.
- No authentication error occurred and no credentials, cookies, tokens, tenant hostname, account identifier, or customer value was persisted.

## Verification

- `node scripts/verify-recon-gate.js evidence SELECTORS.md` - passed with `EVIDENCE READY: 18 terminal entries`.
- `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon` - passed: 17 smoke tests and 30 Vitest tests, including the selected three-fixture admission case.
- `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` - passed with `FINAL VERDICT: block`.
- `npm test` - passed: 17 smoke tests and 29 Vitest tests.

## Known Stubs

None.

## Next Phase Readiness

- Phase 1's repository deliverables are complete and reproducible, but the explicit verdict keeps Phase 2 closed.
- Before changing the verdict to `proceed`, a new explicit human-controlled seam must capture sanitized hover and selected-row paint evidence and re-run contrast/selector checks against the admitted corpus.
- Conclusions remain limited to the English current Agent Workspace observed on 2026-09-03 with account plan unknown/not shared.

## Self-Check: PASSED

- All four created corpus files and this summary exist.
- Task commits `f14b363` and `723b3f1` are present in Git history.
- The final ledger/manifest gate revalidated `FINAL VERDICT: block`.

---
*Phase: 01-dom-recon-spike*
*Completed: 2026-09-03*
