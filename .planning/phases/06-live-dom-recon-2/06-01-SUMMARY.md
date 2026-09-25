---
phase: 06-live-dom-recon-2
plan: 01
subsystem: testing
tags: [fixture-sanitiser, rule-columns, happy-dom, vitest, privacy, recon]

# Dependency graph
requires:
  - phase: 01-dom-recon-spike
    provides: v1 sanitiser (scripts/sanitize-fixture.js), sanitised-output grammar, sensitive scan, fixture manifest validator and the three admitted v1 fixtures
provides:
  - "scripts/rule-column-contract.js: rule-columns vocabulary, per-kind value tokens, table and identity-region boundaries, tokeniser and output validator"
  - "Opt-in sanitizeFixture mode 'rule-columns' with self:/self-alt: denylist directives, boundary option, and the 8- and 10-argument CLI forms"
  - "validateRecon2Fixtures and RECON2_SCENARIOS over the top-level recon2Fixtures manifest array"
  - "test/recon/rule-column-sanitizer.test.js and test/recon/recon2-corpus.test.js"
affects: [06-02, 06-03, phase-8, phase-9, phase-10]

# Actuals (#2632)
actuals:
  tokens: 17895
  tasks: 3
  commits: 5
plan_head_before: 48024dd1ab3a189f50b71956f51f0fd2a2d120cf

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Opt-in sanitiser mode beside an unchanged default: v1 function bodies untouched, one options branch, copied (never mutated) attribute Sets"
    - "Per-(kind, normalised value) token map numbered per kind in one pre-order traversal (attributes before children), so re-sanitising admitted output is byte-identical"
    - "Column ownership: allowlisted vocabulary kept verbatim only in its own header or ticket cell"
    - "Denylist collision check against vocabulary and structural words before any capture is parsed"

key-files:
  created:
    - scripts/rule-column-contract.js
    - test/recon/rule-column-sanitizer.test.js
    - test/recon/recon2-corpus.test.js
  modified:
    - scripts/sanitize-fixture.js
    - scripts/fixture-contract.js

key-decisions:
  - "Header column kind uses exactly one distinct known label among the header's text nodes (not exactly one text node), so a visible label plus a hidden duplicate still resolves"
  - "Inside header cells a self form is tokenised as LABEL, never PERSON-SELF; reserved tokens in headers reject token-kind-mismatch"
  - "The validator reuses datetime-format-unrecognised for any datetime that is not one of the two synthetic literals"
  - "RULE_STRUCTURAL_WORDS also carries aria-relevant (a superset of the plan's list), which only makes collisions fail earlier"

patterns-established:
  - "Rule-columns fixtures live in manifest.recon2Fixtures and are validated by validateRecon2Fixtures; manifest.fixtures and validateFixtureManifest stay v1-only"
  - "New rejection codes are letters and hyphens only, so the recon gate CLI can print them"

requirements-completed: [RECON-05, RECON-06]

coverage:
  - id: D1
    description: "Opt-in rule-columns mode admits a synthetic multi-column table end to end through the 8-argument CLI, the output grammar and a temporary recon2Fixtures manifest, with a byte-identical re-sanitisation"
    requirement: RECON-06
    verification:
      - kind: integration
        ref: "test/recon/rule-column-sanitizer.test.js#admits a synthetic multi-column table end to end through the CLI, grammar and manifest"
        status: pass
    human_judgment: false
  - id: D2
    description: "v1 default path unchanged: default mode still yields only TEXT/ARIA stand-ins, v1 Sets keep their members, v1 tests unmodified and green, three v1 fixture hashes pinned"
    requirement: RECON-06
    verification:
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#the default mode on the same capture still yields only TEXT and ARIA stand-ins (D-10)"
        status: pass
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#importing the rule module leaves every exported v1 Set with its original members"
        status: pass
      - kind: other
        ref: "V1_CORPUS_UNCHANGED pinned-hash check (Task 3 verify command)"
        status: pass
      - kind: integration
        ref: "test/recon/sanitize-fixture.test.js, test/recon/corpus-provenance.test.js, test/recon/fixture-contract.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "Identity-region boundary and reserved PERSON-SELF / PERSON-SELF-ALT / PERSON-SELF-EMBEDDED tokens, self:/self-alt: directives and early denylist-entry-collides"
    requirement: RECON-05
    verification:
      - kind: integration
        ref: "test/recon/rule-column-sanitizer.test.js#admits the smallest name-bearing subtree through the 10-argument CLI and maps the name to PERSON-SELF"
        status: pass
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#keeps self and self-alt distinct and marks an embedded self form"
        status: pass
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#denylist collisions"
        status: pass
    human_judgment: false
  - id: D4
    description: "Kept title/alt with tokens, synthetic datetime by format class, digit-free identifier grammar, probe markers, and the validateRuleColumnOutput rejection table"
    requirement: RECON-06
    verification:
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#kept title, alt and datetime (D-13)"
        status: pass
      - kind: unit
        ref: "test/recon/rule-column-sanitizer.test.js#rule-columns output grammar"
        status: pass
    human_judgment: false
  - id: D5
    description: "validateRecon2Fixtures returns recon2FixtureCount 0 for the real manifest while validateFixtureManifest still returns fixtureCount 3"
    requirement: RECON-06
    verification:
      - kind: integration
        ref: "test/recon/recon2-corpus.test.js#the v1 corpus is untouched and the recon2 corpus validates beside it"
        status: pass
    human_judgment: false
  - id: D6
    description: "Privacy prohibition (flagged, unresolved in the plan): no tenant-authored text survives verbatim in a live rule-columns fixture"
    requirement: RECON-06
    verification: []
    human_judgment: true
    rationale: "Synthetic tests prove the mechanism, but whether a real Zendesk capture leaks tenant text (custom field titles, custom statuses, spellings the vocabulary misses) can only be judged on the live session output in Plan 03"

# Metrics
duration: 13min
completed: 2026-09-25
status: complete
---

# Phase 6 Plan 01: Rule-Columns Sanitiser Mode Summary

**Opt-in `rule-columns` mode of the fixture sanitiser. It keeps Zendesk's own labels only in their own column, turns every tenant value into a per-value kind token (PERSON-001, GROUP-001 and so on), maps the agent's name to reserved PERSON-SELF tokens, admits identity-region captures, and keeps title, alt and a synthetic datetime. Its fixtures go in a separate `recon2Fixtures` manifest array. The v1 default and corpus are byte-for-byte unchanged.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-09-25T13:40:34Z
- **Completed:** 2026-09-25T13:53:30Z
- **Tasks:** 3 of 3
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- `scripts/rule-column-contract.js`, a new file with 14 exports, holds the whole rule-columns grammar:
  - the deep-frozen `DEFAULT_RULE_VOCABULARY`
  - `normaliseRuleValue`: NFC, NBSP-aware whitespace collapse, case-sensitive
  - column kinds taken from the header labels
  - one pre-order tokeniser with a token map keyed on kind and normalised value
  - the table boundary through the unchanged v1 `resolveBoundedDocument`, and a new identity-region boundary: one root, no table, row or landmark, at most 40 elements, at least one reserved token
  - `validateRuleColumnOutput`, which checks that each token kind matches its column and that numbering has no gaps
- `sanitizeFixture` gets two options. `mode: 'rule-columns'` selects the new path and `boundary: 'table' | 'identity-region'` picks the boundary; any other `mode` value rejects `mode-invalid`, and a `boundary` without the mode rejects `boundary-invalid`. The rule-mode denylist parser needs exactly one `self:` line and accepts one optional `self-alt:` line. Any entry that lies inside a vocabulary or structural word rejects `denylist-entry-collides` before the capture is parsed. The CLI adds 8- and 10-argument forms, and the 6-argument form is unchanged.
- `validateRecon2Fixtures` and `RECON2_SCENARIOS` check each `recon2Fixtures` entry in this order: fields, scenario/appearance/boundary consistency, a contained path, SHA-256, the sensitive scan before any parse, then the rule grammar. `validateFixtureManifest` is untouched and still returns fixtureCount 3.
- 88 new tests: 82 in `rule-column-sanitizer.test.js`, 2 in `recon2-corpus.test.js` and 4 more across the other suites. The full recon suite passes (1166 vitest tests and 65 node smoke tests), mutation kills are 39 of 39, and `verify-recon-gate final` still prints `FINAL VERDICT: proceed`.

## Task Commits

1. **Task 1: End-to-end rule-columns admission of one synthetic multi-column table (tracer)**: `a3331a3` (feat)
2. **Task 2: Identity-region boundary and the reserved self tokens**: RED `df1aee9` (test), GREEN `7ad1d4f` (feat)
3. **Task 3: Kept title, alt and datetime, shape markers, identifier grammar and the rejection table**: RED `239b4b7` (test), GREEN `097f96e` (feat, includes a no-behaviour move of the attribute-class Sets)

**Plan metadata:** recorded in the docs commit that follows this SUMMARY.

## TDD Gate Compliance

- Task 2: RED `df1aee9` came before GREEN `7ad1d4f`. The RED record was checked with `check tdd-red-evidence`: RED_EVIDENCE_OK, 33 of 51 tests failing, and the target test failed on its assertion.
- Task 3: RED `239b4b7` came before GREEN `097f96e`. The RED record was also RED_EVIDENCE_OK, 21 of 82 tests failing, and the target test failed on its assertion.
- Vitest's TAP reporter does not print node:test's `# tests/pass/fail` lines. The RED records therefore carry a summary counted from the `ok` and `not ok` lines of the same run.
- There is no separate REFACTOR commit. The only cleanup, moving the three attribute-class Sets above their first use, went into the Task 3 GREEN commit.

## Files Created/Modified

- `scripts/rule-column-contract.js`: rule-columns vocabulary, token grammar, both boundaries, tokeniser, validator, `ruleVocabularyWords` and `RULE_STRUCTURAL_WORDS`
- `scripts/sanitize-fixture.js`: the `ruleModeOptions`, `parseRuleDenylist`, `assertNoDenylistCollision`, `ruleColumnMarkup` and `parseRuleCliArguments` functions, plus one branch each in `sanitizeFixture` and `parseCliArguments`
- `scripts/fixture-contract.js`: `RECON2_SCENARIOS` and `validateRecon2Fixtures`, appended; `validateFixtureManifest` unchanged
- `test/recon/rule-column-sanitizer.test.js`: tracer, options and CLI, column ownership, identity region, self tokens, collisions, title/alt/datetime, identifier and probe grammar, rejection table, v1 isolation and custody subset
- `test/recon/recon2-corpus.test.js`: checks the real manifest's `recon2Fixtures`, then for each entry the checksum, grammar and a byte-identical round trip through the entry's `boundaryKind` (the array is empty until Plan 03)

## Decisions Made

- **Header column kind:** a header is resolved by its whole normalised text or, failing that, by exactly one distinct known non-Priority label among its text nodes. The plan said exactly one text node. The change means a visible label with a hidden duplicate still resolves.
- **Self form in a header cell:** a header cell holding the self form becomes a `LABEL` token, not `PERSON-SELF`. This matches the validator rule that reserved tokens are invalid in headers.
- **Kept values:** kept vocabulary is written in its normalised form. Priority cells keep the v1 trimmed whole-cell rule unchanged.
- **Datetime in the validator:** any datetime that is not one of the two synthetic literals rejects `datetime-format-unrecognised`, which keeps within the documented code set.
- **Committing on `main`:** `git.base-branch --is-protected main` returned true, but the orchestrator explicitly ran this plan as a sequential executor on `main` with normal commits, and earlier phases' task commits are also on `main`. I followed the orchestrator's instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Tracer wrapper identifier removed for the structural-word coverage test**
- **Found during:** Task 2 (GREEN)
- **Issue:** The Task 1 tracer capture's wrapper carried `data-test-id="table-container"`, which is not a v1 identifier. Task 2's coverage test needs every identifier in the tracer output to be in `RULE_STRUCTURAL_WORDS`.
- **Fix:** Removed that attribute from the tracer wrapper, matching the v1 fixtures' bare wrapper `div`, and selected the wrapper with `body > div`.
- **Files modified:** test/recon/rule-column-sanitizer.test.js
- **Verification:** The coverage test and the tracer test pass.
- **Committed in:** `7ad1d4f`

**2. [Ordering] Avatar `alt` kept as PERSON-SELF was tested in Task 3, not Task 2**
- **Found during:** Task 2 (RED)
- **Issue:** Task 2's behaviour list mentions an `img` alt becoming PERSON-SELF, but keeping `alt` at all is Task 3's scope (Task 2 still removes it, as v1 does).
- **Fix:** The Task 2 identity test asserts on `aria-label` and the text node. The alt assertion is in Task 3 (`keeps an identity-region avatar alt as PERSON-SELF`).
- **Committed in:** `239b4b7` / `097f96e`

**3. [Process] Task 3 GREEN committed under a refactor message, then amended**
- **Found during:** Task 3
- **Issue:** The GREEN implementation was staged together with the Set move and committed as `refactor(06-01)`.
- **Fix:** Amended that unpushed HEAD commit's message to `feat(06-01)` (`097f96e`). The content did not change.

---

**Total deviations:** 3 (1 blocking fix to the test data, 1 test-ordering change, 1 commit-message correction)
**Impact on plan:** No change in scope or behaviour. Every must-have truth and acceptance criterion is met.

## Issues Encountered

None.

## Known Stubs

- `DEFAULT_RULE_VOCABULARY.placeholders` is `[]` in `scripts/rule-column-contract.js`. This is intentional under D-11: placeholders join only after the live session in Plan 03 observes them. Nothing reaches a UI.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 03's live session can now admit `rules-light-table`, `rules-identity-region` and `rules-dark-table` captures with `--mode rule-columns [--boundary identity-region]`, and add `recon2Fixtures` entries that `validateRecon2Fixtures` and `recon2-corpus.test.js` check.
- The operator's private denylist must hold full display-name forms. Short or vocabulary-like entries now fail early with `denylist-entry-collides`, which the Plan 02 run sheet should mention.
- The flagged privacy prohibition (D6) stays open until the live fixtures are reviewed.

## Self-Check: PASSED

- FOUND: scripts/rule-column-contract.js, test/recon/rule-column-sanitizer.test.js, test/recon/recon2-corpus.test.js
- FOUND commits: a3331a3, df1aee9, 7ad1d4f, 239b4b7, 097f96e
- Plan verification: `test/recon` passes, `npm run test:recon` passes, `verify-recon-gate final` prints `FINAL VERDICT: proceed`, `git status --porcelain -- extension test/extension` is empty, `test/fixtures/manifest.json` is byte-unchanged, and `V1_CORPUS_UNCHANGED` holds.

---
*Phase: 06-live-dom-recon-2*
*Completed: 2026-09-25*
