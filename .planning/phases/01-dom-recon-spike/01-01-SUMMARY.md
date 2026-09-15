---
phase: 01-dom-recon-spike
plan: 01
subsystem: testing
tags: [node-test, evidence-ledger, privacy, dom-recon, fail-closed]

requires: []
provides:
  - Machine-checked D-13 recon evidence-ledger contract with evidence and final CLI modes
  - Complete pre-capture inventory of fourteen live English-path DOM questions
  - Deterministic fail-closed sensitive-fixture admission policy with private denylist enforcement
affects: [01-02, 01-03, 01-04, 01-05, phase-02]

actuals:
  tokens: 10140
  tasks: 2
  commits: 7

tech-stack:
  added: []
  patterns: [Node built-in test runner, fail-closed markdown validation, value-safe structured findings]

key-files:
  created:
    - SELECTORS.md
    - scripts/verify-recon-gate.js
    - test/recon/recon-gate.smoke.js
    - test/recon/sensitive-patterns.js
    - test/recon/sensitive-patterns.smoke.js
  modified: []

key-decisions:
  - "Keep unverified live facts as Recon Question templates, distinct from admitted Ledger Entry evidence."
  - "Require an explicit block verdict while any English-path recon question remains unresolved."
  - "Expose only stable category and code findings from the sensitive scanner, never matched values or input locations."

patterns-established:
  - "Evidence admission: question templates become ledger entries only after sanitized evidence exists and status is terminal."
  - "Privacy diagnostics: sensitive-content failures throw structured value-free findings and never downgrade to warnings."

requirements-completed: [RECON-01, RECON-02, RECON-03]

coverage:
  - id: D1
    description: "Production evidence-ledger tracer validates complete D-13 entries and explicit proceed or block verdicts."
    requirement: RECON-02
    verification:
      - kind: integration
        ref: "node --test test/recon/recon-gate.smoke.js"
        status: pass
      - kind: other
        ref: "node scripts/verify-recon-gate.js final SELECTORS.md"
        status: pass
    human_judgment: false
  - id: D2
    description: "SELECTORS.md inventories all fourteen live observations and keeps seven spec-less probes visibly unresolved."
    requirement: RECON-03
    verification:
      - kind: unit
        ref: "test/recon/recon-gate.smoke.js#repository ledger inventories all minimum live observations as unresolved"
        status: pass
      - kind: unit
        ref: "test/recon/recon-gate.smoke.js#all seven spec-less planning probes remain visibly unresolved"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sensitive fixture scanner rejects every D-02 residual class and requires a non-empty capture-specific denylist."
    requirement: RECON-01
    verification:
      - kind: unit
        ref: "node --test test/recon/sensitive-patterns.smoke.js"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-03
status: complete
---

# Phase 01 Plan 01: Offline Recon Contract Summary

**Fail-closed recon ledger and sensitive-fixture admission policy with a complete pre-authentication DOM question inventory and an honest block verdict**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-03T08:42:47Z
- **Completed:** 2026-09-03T08:54:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built a production-quality ledger validator that rejects incomplete evidence, duplicated IDs, invalid statuses, missing scenarios, duplicated or missing final verdicts, and proceed verdicts with unresolved English-path questions.
- Seeded all fourteen minimum live recon observations with exact probes, scenarios, evidence requirements, fallbacks, and explicit unresolved status without claiming a live Zendesk fact.
- Added deterministic fixture admission rules for active markup, resource URLs, emails, tenant hosts, long identifiers, opaque values, embedded state, and every private denylist token while keeping diagnostics value-free.

## Task Commits

Each TDD gate and completed task was committed atomically:

1. **Task 1 RED: failing recon ledger tests** - `184193b` (test)
2. **Task 1 GREEN: fail-closed ledger validator** - `1ef1daa` (feat)
3. **Task 2 RED: sensitive fixture policy tests** - `02f2b0f` (test)
4. **Task 2 RED: complete question inventory tests** - `97f5d66` (test)
5. **Task 2 RED: unresolved-question verdict test** - `e531248` (test)
6. **Task 2 GREEN: inventory and admission policy** - `a3faec0` (feat)

## Files Created/Modified

- `SELECTORS.md` - Synthetic ledger tracer, complete live-question inventory, scope-only localization entries, unresolved assumption register, and current block verdict.
- `scripts/verify-recon-gate.js` - ESM validator and CLI for evidence-only and final ledger modes.
- `test/recon/recon-gate.smoke.js` - Contract, fail-closed verdict, inventory, and assumption coverage.
- `test/recon/sensitive-patterns.js` - Shared deterministic fixture scanner and `SensitiveFixtureError`.
- `test/recon/sensitive-patterns.smoke.js` - Clean, forbidden-category, denylist, stability, and value-redaction coverage.

## Decisions Made

- Pre-capture live questions use a separate `Recon Question` heading so they cannot masquerade as admitted D-13 evidence.
- The repository currently records `block`, not `proceed`, because all fourteen English-path live questions remain unresolved until authenticated recon.
- Scanner findings contain only stable category and code identifiers; matched content and input locations never enter exceptions or logs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the missing-denylist test helper**
- **Found during:** Task 2 GREEN verification
- **Issue:** Passing explicit `undefined` activated the helper's default argument, so one missing-denylist case incorrectly exercised the clean default policy.
- **Fix:** Switched the helper to rest arguments so omitted options use the clean default while explicit `undefined` reaches the scanner unchanged.
- **Files modified:** `test/recon/sensitive-patterns.smoke.js`
- **Verification:** The full 17-test suite passes, including all four missing or empty denylist cases.
- **Committed in:** `a3faec0`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug)
**Impact on plan:** The fix made the intended fail-closed policy test non-vacuous; scope and production behavior were unchanged.

## Issues Encountered

- The repository sandbox initially denied Git index writes. Commits were retried through the approved Git permission path with normal hooks; no verification was bypassed.

## Known Stubs

None. The fourteen unresolved `Recon Question` templates are intentional gate inputs for later Phase 1 plans, and their presence forces the explicit `block` verdict rather than simulating live evidence.

## User Setup Required

None for this plan. The authenticated English Zendesk session and three live scenarios remain a later blocking human-action gate.

## Next Phase Readiness

- Plan 01-02 can use the stable ledger and sensitive-admission contracts for package-legitimacy and authenticated-session gates.
- Phase 2 remains blocked: this plan intentionally records no live Zendesk conclusion, fixture, Shadow DOM ruling, or current `data-garden-id` finding.

## Self-Check: PASSED

All five implementation files and all six task/TDD commits were verified present. No skipped tests, TODO/FIXME markers, or unrun verification steps remain.

---
*Phase: 01-dom-recon-spike*
*Completed: 2026-09-03*
