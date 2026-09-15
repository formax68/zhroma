---
phase: 02-first-tint-on-a-real-view
plan: 01
subsystem: ui
tags: [chrome-extension, manifest-v3, mutation-observer, happy-dom, vitest]
requires:
  - phase: 01-dom-recon-spike
    provides: Admitted three-fixture corpus, Garden selector evidence, passed verification with AR-01-13 exception
provides:
  - Three authored loadable extension assets for default-enabled initial tint
  - Whole-table exact-English preflight, atomic marker writes and finite startup disposal
  - Actual-runtime and CSSOM tests with adverse-input and data-channel regressions
affects: [02-02, 03-the-tint-survives-everything, 04-honest-failure-and-an-off-switch]
tech-stack:
  added: []
  patterns: [classic private IIFE, static isolated top-frame injection, direct-cell CSS paint, finite initial snapshot]
key-files:
  created: [extension/manifest.json, extension/content.js, extension/zhroma.css, test/extension/initial-tint.test.js, test/extension/runtime-contract.test.js]
  modified: [vitest.config.js]
key-decisions:
  - "Keep the grouped corpus's redacted unknown Priority text untinted; known-label grouped coverage uses explicitly synthetic in-memory copies."
  - "Use Node Vitest environments with dedicated inert happy-dom windows so trusted runtime bytes execute as classic scripts and file URLs remain local."
requirements-completed: [DETECT-01, DETECT-02, TINT-01, TINT-02, TINT-03, TINT-04, TINT-05, CTRL-01, STORE-02, STORE-03, STORE-05]
coverage:
  - id: D1
    description: Exact-English initial table detection and atomic markers across delayed and malformed views
    requirement: DETECT-02
    verification:
      - kind: integration
        ref: test/extension/initial-tint.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: Exact manifest grants, local authored assets, four direct-cell CSS rules and zero data-channel calls
    requirement: STORE-02
    verification:
      - kind: integration
        ref: test/extension/runtime-contract.test.js
        status: pass
    human_judgment: false
  - id: D3
    description: Authentic first-load readiness, palette distinctness, legibility and native interaction preservation
    verification: []
    human_judgment: true
    rationale: "02-02 owns authentic source-bound acceptance; inert fixture/CSSOM tests cannot establish live appearance or A1/A2."
actuals:
  tokens: 9804
  tasks: 2
  commits: 6
duration: 12min
completed: 2026-09-08
status: complete
---

# Phase 2 Plan 1: Initial Tint Runtime Summary

**A three-file MV3 extension validates one complete English Garden table, stamps exact priority attributes atomically, and paints four translucent direct-cell backgrounds during a bounded initial-load attempt.**

## Performance

- Started: 2026-09-08T12:00:17Z
- Implementation verified: 2026-09-08T12:11:13Z
- Tasks: 2; implementation/test files: 6
- Actual token estimate: ceil(39214 / 4) = 9804, measured over the realized six-file implementation/test Git diff from 608d98e through 6fc6161; excludes planning metadata and harness token usage.
- Commits: four RED/GREEN task commits, one summary commit, one tracking commit.

## Accomplishments

- Frozen manifest: MV3, Zhroma 0.1.0, storage only, no host_permissions, one HTTPS agent match, isolated world, top frame, document_idle. Storage remains unused.
- Header indexing includes every direct header cell. Supported labels use only textContent.trim() and exact case-sensitive English equality. Blank is untinted; unknown or ambiguous complete input refuses the whole table without transient writes.
- The observer starts before discovery, observes childList/characterData only, coalesces checks for 100 ms, and never extends its 15000 ms cap. Success, expiry, pagehide and exceptions dispose it. Later rows are intentionally outside Phase 2's liveness scope.
- Final synchronous preflight checks ownership/connectivity and snapshot equivalence after disconnect. A write exception rolls back this attempt's changed attributes, retaining prior values and unrelated state.
- CSS assigns only background-color through four exact marker rules to direct ticket cells. Native row paint, inset, text, focusability, class/style/ARIA, node order and listeners remain unchanged by runtime writes.
- No new dependencies, installs, network calls, live account actions, fixture edits or historical-evidence changes.

## Task Commits

1. Task 1 RED — `ad6d452`: failing actual manifest/script/CSS tracer and deliberate test discovery.
2. Task 1 GREEN — `b4c3aa9`: three authored extension assets; 3/3 tracer tests pass.
3. Task 2 RED — `8ba0137`: adverse views and runtime contracts; nested foreign group-row topology regression fails (71/72 pass).
4. Task 2 GREEN — `6fc6161`: reject foreign topology inside excluded groups; 72/72 pass.

The tracer feedback gate reran both automated commands after Task 1's commit and passed before expansion. No refactor commit was necessary.

## Verification

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/initial-tint.test.js` | Task 1: 3 passing tests; expanded file: 64 passing tests |
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension` | 2 files, 72 passing tests |
| `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon` | 65 Node smoke tests and 180 Vitest tests across 6 files; all 245 pass; no skips/todos |
| `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` | `FINAL VERDICT: proceed` before and after implementation |
| `git diff --check` and scoped fixture/dependency diff | Clean whitespace; no fixture, checksum or dependency changes |

Tests execute every declared runtime script as trusted repository bytes in node:vm, with fixture resource loading/evaluation/navigation disabled. A real happy-dom MutationObserver exercises delayed insertion; controlled observer delivery and fake timers cover exact deadline/settling paths. Runtime tests execute fail-on-call network, beacon, Chrome/web storage and related channel sentinels; success and refusal both report zero calls. CSSOM rules are parsed from the authored stylesheet and match explicit direct-cell targets with independent expected hues.

## Files and Runtime Symbols

- `extension/manifest.json`: exact static extension loader/grant contract.
- `extension/content.js`: private `PRIORITY_ATTRIBUTE`, `PRIORITY_LABELS`, `STARTUP_DEADLINE_MS`, `SETTLE_MS`; `inspectCandidateTable(document)`, `commitSnapshot(snapshot)`, `startInitialTint(document)`, `disposeStartup()`. Additional selector constants and local helpers stay inside the IIFE. No exports/test hooks.
- `extension/zhroma.css`: four unlayered background-color declarations; no !important needed for structural tests. Actual cascade acceptance remains pending.
- `test/extension/initial-tint.test.js`: 64 actual-byte behaviors, including whole-table refusal, synthetic topology variants, row identity/text/listeners, rollback and finite lifecycle.
- `test/extension/runtime-contract.test.js`: 8 manifest, asset, CSSOM and no-side-effect tests.
- `vitest.config.js`: discovers recon and extension tests together; package scripts unchanged.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 3 - Blocking] Dedicated Node test environment.** The initial helper encountered a non-file import.meta.url under the globally configured happy-dom environment. Each extension test file now selects Vitest's Node environment and creates its own inert happy-dom window. After correcting that harness issue, Task 1 RED failed on the absent runtime assets as intended. Commits: `ad6d452`, `8ba0137`.
2. **[Rule 1 - Bug] Group exclusion could hide nested foreign topology.** Task 2's known-label synthetic grouped variant proved nested rows inside a group were ignored while sibling tickets were tinted. Group direct cells now validate their identifiers, spans and lack of nested row/cell structure before exclusion. Regression: `nested foreign row inside a group invalidates the complete candidate`. Commit: `6fc6161`.

No architectural or permission changes. No auth gate occurred. Test setup corrections used the actual grouped fixture's redacted unknown values and retained a shared fake clock for concurrent documents; no evidence was rewritten.

## Remaining Acceptance and Specification Boundaries

- **A1 remains unverified:** 15000/100 ms is a startup heuristic, not an observed semantic app-ready signal. Authentic cold-load and delayed batch validation belongs to 02-02.
- **A2 remains unverified:** the four delegated seed colors need authentic light-interface distinctness, legibility, hover, selection/inset, unread/bold and focus/click acceptance against the final loaded source.
- **E02–E11, E14–E16, E18:** all fourteen classified predicates have executable assertions. E08's native-text/DOM portion passes; its visual legibility portion still needs 02-02. Equality uses trim only; adjacent duplicates retain separate nodes/direct-cell targets; reordering preserves mappings; empty markers select no tint; isolated documents do not coordinate.
- **E01, E12, E13, E17, E19, E20:** the six unclassified specification probes remain unresolved flagged assumptions for explicit verifier disposition. Their related concrete header, manifest and byte contracts passing does not auto-dismiss them.
- **P-02-01–P-02-04:** intent remains resolved but descriptor-less judgment evidence is flagged-unverified. Tests provide support, not automatic judgment approval. P-02-05/P-02-06 remain owned by 02-02. Independent code/security/phase review is still required.
- **AR-01-13:** Phase 1 remains passed with its accepted exception. Historical approval independence is still not-attested. Fixtures remain approved repository-byte re-admission, not fresh captures or new live proof.
- The `requirements-completed` frontmatter lists the plan's traceability scope per the template; it does not claim all eleven are fully accepted. Shared-ID readiness currently permits only DETECT-02, STORE-02 and STORE-03 to be marked complete. Eight shared IDs remain pending until 02-02 and its gates are handled.

## Known Stubs and Threat Surface

No implementation stubs, skipped tests, unrun automated verification or new threat surface outside T-02-01 through T-02-05/T-02-SC were found. Blank/null/empty values represent deliberate parser states and test inputs, not missing UI wiring. No new endpoint, authentication path, file access or schema boundary was added to the runtime.

## Next Plan Readiness

`extension/` is ready for 02-02 to prepare the source-bound live acceptance record and perform the authorized real-view checkpoint. Phase 2 is still in progress. Persistent reapplication remains Phase 3; controls/hints/storage behavior remain Phase 4; publication remains Phase 5.

## Self-Check: PASSED

All five created assets/test files, modified Vitest config and this summary exist. All four recorded task commits resolve. Required automated commands passed; no fixture/dependency changes or unintended deletions were found. Product appearance and independent review remain pending as stated above.
