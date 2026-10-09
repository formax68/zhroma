---
phase: 08-themes-that-follow-dark-mode
plan: "04"
subsystem: ui
tags: [chrome-mv3, themes, lifecycle, bfcache, generations, parity]
requires:
  - phase: 08-01
    provides: Root-only palette application and confirmed theme queue
  - phase: 08-02
    provides: Eight admitted light/dark palettes
provides:
  - Palette fault isolation and differing-value-only root emissions
  - Per-read settings ownership across out-of-order restoration callbacks
  - Actual-source startup, restore, propagation and support-boundary regressions
  - Target/options-filtered inherited manual observer doubles
affects: [08-05, 09-colouring-rules, 10-settings-editor]
tech-stack:
  added: []
  patterns: [native-observer-probes, independent-enable-generations, per-read-settings-generations]
key-files:
  created: [test/extension/theme-runtime.test.js]
  modified: [extension/content.js, test/extension/tracer-world.js, test/extension/chrome-harness.js, test/extension/parity.test.js, test/extension/persistent-tint.test.js, test/extension/settings-reader.test.js]
key-decisions:
  - "Palette faults cannot abort readiness, restoration or the off listener; identical emitted values are suppressed."
  - "Each settings read advances existing per-key generations so older snapshots lose ownership even when a frozen document missed storage events."
  - "Existing row-observer assertions remain scoped to the document observer; the independent root observer has an exact separate filter contract."
requirements-completed: [DARK-01, DARK-02, DARK-04, DARK-05, THEME-01, THEME-06]
coverage:
  - id: D1
    description: "Exact host marker, selected-theme light fallback, bounded startup and restored appearance precede row paint without added palette row work."
    verification:
      - kind: integration
        ref: test/extension/theme-runtime.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: "One actual worker save propagates to independent content modes; off/no-view and Priority diagnoses remain independent, and stale read snapshots cannot regress a newer choice."
    verification:
      - kind: integration
        ref: test/extension/theme-runtime.test.js#older suspended startup read cannot overwrite a newer restored snapshot delivered first
        status: pass
      - kind: integration
        ref: test/extension/theme-runtime.test.js#one real worker save reaches two supported modes, an off sibling and a no-view sibling without row work
        status: pass
    human_judgment: false
  - id: D3
    description: "Dark admitted fixtures preserve direct-cell/group/head/sticky/native style ownership and immutable Classic baseline, storage and network contracts."
    verification:
      - kind: integration
        ref: test/extension/theme-runtime.test.js
        status: pass
      - kind: integration
        ref: test/extension/parity.test.js
        status: pass
      - kind: integration
        ref: test/extension/frozen-contract.test.js
        status: pass
    human_judgment: false
actuals:
  tokens: 10296
  tasks: 2
  commits: 5
commits: 5
plan_head_before: 76358875ef28de084fcae355888db85a4d24e475
duration: 12min
completed: 2026-10-09
status: complete
---

# Phase 8 Plan 4: Document Lifetime and All-View Themes Summary

**Exact Zendesk appearance and saved themes remain independent of row evaluation through startup, suspension, restoration and cross-view saves, including out-of-order settings replies.**

## Performance

- Started: 2026-10-09T05:52:28Z.
- Final implementation verification/commit: 2026-10-09T06:04:00Z.
- Tasks: 2. Files: 7 implementation/test paths plus this summary.
- Estimate-scale actual: 41,183 realized diff characters / 4, rounded up to 10,296. Five task commits measured from the persisted per-plan ledger before this metadata commit; these are not harness token counts.

## Accomplishments and Source Evidence

- `extension/content.js:76` isolates palette resolution/emission faults from readiness and the off switch, resolves all numeric values before CSSOM writes, suppresses identical values, and commits the effective identity only after successful application. A failed application can be retried by a later relevant delivery without a timer/retry loop.
- `extension/content.js:100` retains the independent root observer with exactly `attributes:true, attributeFilter:['data-theme']`. It reads the current root marker rather than a stale mutation record; exact `dark` selects dark and every other value selects the current theme's light variant. It observes neither root style nor OS preference. Repeated Light/Dark/Light deliveries converge before an additional theme debounce could run.
- `extension/content.js:461`–`472` preserves visibility and bfcache row-controller behavior: pagehide disconnects both observers, pageshow rereads current mode before preference readiness, and repeated restores retain two observer objects and three lifetime listeners. Hidden documents retain only the independent appearance detector, as allowed by the plan; off documents may update properties without enabling tint.
- `extension/content.js:576` advances existing settings generations at every read, then captures their ownership. Both storage events and newer restored reads supersede old replies. This fixes an actual race where a frozen document misses a worker save, reads the new value after restore, then receives an older startup callback that formerly reverted the palette.
- `test/extension/theme-runtime.test.js` contains 27 actual-source cases. Native observer instrumentation records real targets/options/delivery batches, table queries, header/Priority text reads, marker writes/removals, root emissions, first-paint values and listener/observer counts. Palette-only operations assert zero queries, reads and stamps, including duplicate effective changes.
- The suite covers fast, delayed, failed, failed-with-values, throwing and hung dark startup reads; bounded 500ms Classic fallback; late property-only valid results; exact unknown/empty/case/whitespace/numeric marker fallback; ignored host style/class/data-color-scheme and descendant-marker changes; latest same-batch mode; visibility return; repeated restores; CSSOM faults; late enable/theme generations; and reversed settings replies across missed frozen events.
- One real worker save updates two supported documents in different modes, an off sibling and a no-table sibling with exactly one intended theme envelope/write/event. The off sibling models a document that missed an enable event while frozen; theme events preserve its independent local enable state. Storage bytes, per-document properties and existing diagnoses/actions are checked separately.
- Enabled English regional, unsupported locale, subframe, unsafe topology, absent Priority and blank Priority worlds retain their original admission and diagnoses under a saved accepted palette. Corrupt/future/unknown values preserve raw stored bytes and fall back without repair; removed keys restore Classic; other storage areas/keys do nothing.
- The admitted Recon 2 dark table and historical grouped shape fixture prove direct-cell selector ownership and untouched native row/selection/focus-outline/sticky/head/group structures. The historical grouped fixture's redacted priority stand-ins are seeded with recognized Low values, as its inherited parity guardians already do. No browser-pixel or human native-state acceptance is inferred.

## Task Commits

1. Task 1 RED — `2e54b7e` — `test(08-04): expose palette fault and redundant emission gaps`.
2. Task 1 GREEN — `c9a053e` — `fix(08-04): isolate palette faults and deduplicate property emissions`.
3. Separate authorized representation rationale — `edba4a4` — `test(08-04): distinguish appearance and row observer contracts`.
4. Task 2 RED — `2700e0f` — `test(08-04): prove cross-view themes and stale restored-read race`.
5. Task 2 GREEN — `f5ca853` — `fix(08-04): reject stale settings replies across restoration`.

All commits used normal hooks on `codex/phase08-themes`. No tracked deletion occurred. Shared planning state remains owned by the orchestrator.

## Verification

- Final prescribed Task 1 command: theme-runtime, theme-tracer, settings-reader, persistent-tint and parity — **268/268 passed**, no skips.
- Final prescribed Task 2 command: theme-runtime, theme-tracer, parity, frozen-contract, settings-reader, upgrade-storage and diagnosis — **239/239 passed**, no skips.
- `npm --prefix . run typecheck` — **passed** for both current and v1 no-emit projects.
- Both intentional REDs were reproduced against actual source in standalone Node TAP mirrors and accepted as `RED_EVIDENCE_OK` before production implementation. Task 1 failed on zero rows under a CSSOM fault; Task 2 failed when the older callback changed Nord back to Catppuccin. Both mirrors subsequently passed against the fixes.
- Native Vitest TAP has a nested file-level summary that the SDK cannot classify. The standalone mirrors ran real source/assertions, not synthesized TAP. Node needed an explicit TAP reporter; an initial default-reporter record was `INVALID_RED: zero_tests_discovered` and was rerun correctly before GREEN. RED evidence and mirrors remain at `/private/tmp/zhroma-08-04*-red*`, outside the package/repository.
- `git diff --check` passed. Frozen contracts and CSS production selectors were not edited; baseline revision remains `6d3ab0b10e9419a5c1077e59e468977c00d59d4a`.

## Deviations from Plan

**1. [Rule 3 — Blocking representation] Scoped inherited test updates.**
- The first prescribed run exposed 26 persistent-tint observer-count failures and two settings-reader failures from contracts introduced in 08-01: a separate root observer and unreadable effective-Classic no-op selection. A follow-up found the old no-settings-traffic helper omitted the new packaged-popup-only `get-theme` protocol.
- The orchestrator explicitly authorized extending scope to `test/extension/persistent-tint.test.js` and `test/extension/settings-reader.test.js`. Existing test names, row-controller behavior assertions and baseline bytes are preserved. Root options are asserted separately; manual deliveries in parity/persistent suites now honor real target/subtree/type/attribute filters via `chrome-harness.js`.
- The old Classic-save assertion now expects `unchanged`, exact preserved corrupt bytes and no fabricated storage event. Only the explicit popup `get-theme` exchange joins the existing `set-setting` exemption; status/apply traffic remains settings-free. Why rationale is recorded separately in `edba4a4`.

No new runtime dependency, storage key/schema, route detector, permission, network endpoint or message protocol was introduced. The settings-generation repair is within the planned lifetime/callback ownership seam.

## Known Stubs and Threat Surface

None introduced. No skipped test or unrun prescribed verification remains. Empty probe/event accumulators are functioning test instrumentation, not UI stubs. The pre-existing later-phase options-page stub remains unchanged. No security surface beyond the plan's root-marker/local-storage/numeric-CSS boundaries was added; frozen local-only and no-network tests pass.

## Evidence Limits and Next Plan Readiness

Source-bound simulated lifecycle, propagation, structure and numerical-property evidence is ready for 08-05. Final flattened Chrome pixels, real Zendesk hover/selection/focus and human acceptance remain separate 08-05/Phase 11 obligations. Full phase regression and mutation gates were not run here; they remain scheduled in 08-05, and no phase completion is claimed.

Phase 6 retains custody follow-up and six unaccepted human checks; its consumer `proceed` verdict does not close them. Phase 7 review dispositions and later CAS-key obligations remain unchanged. Requirement IDs above identify assigned source-level coverage, not a new human attestation or completed phase.

STATE/ROADMAP/REQUIREMENTS/state.json were neither edited nor committed by this executor; the orchestrator handles shared updates to preserve incoming changes. Unrelated `.DS_Store`, `.gsd/`, milestone lock, Phase 5 walkthrough, Phase 6 custody closeout and research caches remain untouched. No private browser profile was read. No authentication gate or external user setup was required.

## Self-Check: PASSED

All seven changed implementation/test paths exist. Commits `2e54b7e`, `c9a053e`, `edba4a4`, `2700e0f` and `f5ca853` exist on the current branch; the persisted ledger measures five task commits. All final prescribed checks passed, there is no uncommitted implementation change, no tracked deletion, no new stub, and no unimplemented goal found in the scoped source scan. Shared state updates are explicitly delegated.
