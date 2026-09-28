---
phase: 07-upgrade-safe-foundation
plan: 07
subsystem: testing
tags: [mv3, upgrade, chrome-storage-local, onInstalled, onStartup, worker-restart, tracer-world, mutation-testing]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-05 tracer CONTENT_URL, optionsSender and the eight worker-side settings-foundation mutants
  - phase: 07-upgrade-safe-foundation
    provides: 07-06 content settings gate and the settings-reader.test.js markers for the three gate mutants
  - phase: 07-upgrade-safe-foundation
    provides: 07-03 Zhroma.settings resolve (absent means default, newer v unreadable)
provides:
  - tracer-world worker runtime onInstalled and onStartup; emitInstalled, emitStartup, installedListenerCount, startupListenerCount
  - test/extension/upgrade-storage.test.js (8 tests) proving COMPAT-02, COMPAT-03 and DATA-01 across install, update, startup and a worker restart
  - markers [mutant:settings-absent-default] and [mutant:settings-newer-version-unreadable] in settings-module.test.js
  - five measured-killed mutants; settings-foundation.mutants.json now holds 13 entries
affects: [07-08 tsc checkJs, 07-09, 08-themes, 11-release (D-28 upgrade-in-place checklist item)]

actuals:
  tokens: 4400
  tasks: 2
  commits: 4
plan_head_before: bb8745fde77c60504e3684afe8253d936a2ce3d2
plan_head_after: f11d64ccee6fa646e1f589c7a6c273d6e63ccf60

tech-stack:
  added: []
  patterns:
    - "Lifecycle events are modelled, not refused: the double records install and startup listeners, so a later worker that registers one shows up as a count rather than a TypeError the worker could swallow"
    - "A worker restart is proven idle by the new epoch's apiLog: before anything asks it for anything, it only registers its four listeners"

key-files:
  created:
    - test/extension/upgrade-storage.test.js
  modified:
    - test/extension/tracer-world.js
    - test/extension/settings-module.test.js
    - test/mutants/settings-foundation.mutants.json

key-decisions:
  - "settings-failure-opens-gate is registered as the lastError variant, targeting only 'a rejected settings read tints with no wait'. The runner filters to the one target test by name, so the sibling rejected-with-values case never runs and cannot fail as unrelated"
  - "The unreadable-theme upgrade cases emit { reason: 'install' } as the plan says. No listener exists, so the event is inert whatever its reason, and the listener-count assertion is what proves that"
  - "COMPAT-03 'requests nothing' is measured as the restarted worker's apiLog equalling the four addListener calls, with no storage, tabs or action call"

patterns-established:
  - "Upgrade-state tests run the same helper (lifecycle event, startup, terminate, reload, fresh popup) so every starting storage goes through the identical sequence"

requirements-completed: [COMPAT-02, COMPAT-04, DATA-01]

coverage:
  - id: D1
    description: "A 0.1.0 install switched off stays off through an update from 0.1.0, a startup and a worker restart: nothing written, storage { enabled: false }, no markers, toolbar and fresh popup off, no install or startup listener"
    requirement: COMPAT-02
    verification:
      - kind: integration
        ref: "test/extension/upgrade-storage.test.js#a 0.1.0 install switched off stays off through the update, a startup and a worker restart, and nothing is written"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nothing stored with install, and enabled false or true with update from 0.1.0, each keep byte-identical storage, matching markers and toolbar, a listeners-only restart, and answer unchanged to a theme message for the value in effect"
    requirement: COMPAT-02
    verification:
      - kind: integration
        ref: "test/extension/upgrade-storage.test.js#%s keeps exactly its storage through the lifecycle event, a startup and a worker restart (3 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "enabled true with a null, {}, bare-string or v: 99 stored theme tints all four rows through install, startup and restart, with storage byte-identical"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/upgrade-storage.test.js#a stored theme of %s tints as 0.1.0 does through install, a startup and a restart, and storage is byte-identical (4 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Across every upgrade test the sync, session and managed areas are never touched (world.forbidden empty)"
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "test/extension/upgrade-storage.test.js (all 8 tests assert world.forbidden equals [])"
        status: pass
    human_judgment: false
  - id: D5
    description: "Five new mutants measured killed before registration: settings-gate-bound, settings-gate-required, settings-failure-opens-gate, settings-absent-default, settings-newer-version-unreadable; 13 settings-foundation entries in all"
    verification:
      - kind: other
        ref: "for id in ...; node scripts/verify-mutation-kills.js --only $id -> ALL_NEW_CONTENT_MUTANTS_KILLED"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js -> MUTATION KILLS: 52/52 killed"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon -> 32 files, 1439 Vitest tests, exit 0"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 07: Upgrade-State Proofs and Remaining D-30 Mutants Summary

**The tracer now fires install, update and browser-start events, and a new upgrade-storage suite proves that a fresh install and a 0.1.0 install (switched on or off) keep byte-identical storage through the lifecycle event, a startup and a worker restart. No listener is registered. The restarted worker only registers its listeners. A theme message for the value in effect answers `unchanged` and writes nothing. Four unreadable stored themes still tint all four rows. Five more guards have mutants, each measured killed, and the full gate passes 52/52.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-09-28T09:23:55Z
- **Completed:** 2026-09-28T09:32:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `tracer-world.js`: the worker runtime gains `onInstalled` and `onStartup`, and their `addListener` records listeners. `emitInstalled(details)` and `emitStartup()` deliver asynchronously with a copy of the details, as Chrome does. `installedListenerCount()` and `startupListenerCount()` report the counts. `terminateWorker()` drops both lists.
- `upgrade-storage.test.js` has 8 tests:
  - the Task 1 tracer: a 0.1.0 install switched off;
  - three upgrade states: nothing stored with `install`, and `enabled` false or true with `update` from `0.1.0`;
  - four unreadable stored themes with `enabled: true`.

  Every test drives the same sequence: the lifecycle event, a startup, a worker terminate and reload, then a fresh popup against the new epoch.
- COMPAT-03's idempotency edge is measured directly. Before anything asks the restarted worker for anything, its apiLog is exactly the four `addListener` calls. It makes no storage read or write and no tabs query.
- Five mutants were appended one at a time, and each printed `MUTATION KILLS: 1/1 killed` before it was kept. The eight 07-04 and 07-05 entries are unchanged.

## Task Commits

1. **Task 1: A 0.1.0 install switched off survives update, startup and a worker restart with nothing written (tracer)**
   - `756aea5` (test): install, update and browser-start doubles on the tracer worker runtime, as a separate test-double commit
   - `b830cc5` (test): the upgrade-storage tracer test for `{ enabled: false }`
2. **Task 2: Every upgrade state and unreadable theme, and the remaining D-30 mutants**
   - `e35d739` (test): the three upgrade states and the four unreadable stored themes
   - `f11d64c` (test): two settings-module markers and five measured-killed mutants

The tracer feedback gate ran in interactive `end-of-phase` mode, and Task 1's verify is automated-only. That verify was re-run and passed (5 files, 159 tests), so the plan went on to Task 2. As a fidelity check, a temporary `onInstalled` listener that writes `{ enabled: true }` was appended to `background.js`. The tracer test failed on it, and `background.js` was then restored.

## Files Created/Modified
- `test/extension/tracer-world.js` - lifecycle event doubles and listener counts.
- `test/extension/upgrade-storage.test.js` - COMPAT-02, COMPAT-03, COMPAT-04 (empty edge) and DATA-01 upgrade proofs.
- `test/extension/settings-module.test.js` - `[mutant:settings-absent-default]` on the absent-theme assertion and `[mutant:settings-newer-version-unreadable]` on the rejection-table assertion. No test was renamed.
- `test/mutants/settings-foundation.mutants.json` - `settings-gate-bound`, `settings-gate-required`, `settings-failure-opens-gate`, `settings-absent-default`, `settings-newer-version-unreadable`.

## Mutants registered (each measured killed)

| Id | Mutation | Target test | First failing assertion |
|----|----------|-------------|-------------------------|
| settings-gate-bound | the time-bound callback only clears the timer | a hung settings read holds rows untinted for at most the time bound, then tints and leaves no timer | markers expected LABELS |
| settings-gate-required | `settingsReady && ` dropped from `runnable()` | the first tint waits for the settings read even when the preference is already confirmed | markers expected [] |
| settings-failure-opens-gate | a read reporting `lastError` no longer lands | a rejected settings read tints with no wait | markers expected LABELS |
| settings-absent-default | absence resolves as `unreadable` | an absent theme resolves to Classic by default, and the stored Classic form resolves as stored | status `default` |
| settings-newer-version-unreadable | the `version > entry.version` bound removed | a newer v resolves to the Classic default as unreadable, without touching the stored value | status `unreadable` |

## Decisions Made
- `settings-failure-opens-gate` uses the `lastError` variant from the 07-06 table, and its only target is the `rejected` case. `verify-mutation-kills.js` runs only the target test, selected with `--testNamePattern`. The `rejected-with-values` case therefore never runs under the mutant and cannot trigger `unrelated-assertion-failed`.
- The unreadable-theme cases emit `{ reason: 'install' }`, as the plan says. With no listener registered, the event is inert whatever its reason. The listener-count assertions are what prove that.
- The three-state test also sends the theme message in every state. This carries the COMPAT-02 "nothing new is stored" check beyond the Task 1 off state.

## Deviations from Plan

### Procedural

**1. [Process] Extra assertions beyond the plan's list.** These are:
- the restarted worker's apiLog is listeners-only (the COMPAT-03 "requests nothing" truth);
- a fresh popup's status text and switch position;
- the `unchanged` theme reply in all three upgrade states.

They strengthen the proofs and change no shipped byte.

**2. [Process] The HEAD safety check reports `main` as protected.** Commits went to `main` as directed (`branching_strategy: none`), as in 07-01 to 07-06.

---

**Total deviations:** 0 auto-fixed, 2 procedural
**Impact on plan:** None. Every truth, artifact and key link in the plan is met.

## Issues Encountered
None.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- The settings-foundation registry is complete at 13 entries. The full gate is 52/52: 39 v1 mutants and 13 from Phase 7.
- The real upgrade-in-place check on a Chrome profile is still on the Phase 11 release-candidate checklist (D-28). This plan proves COMPAT-02 against the tracer's `storage.local` double only.

## Self-Check: PASSED
- FOUND: test/extension/tracer-world.js, test/extension/upgrade-storage.test.js, test/extension/settings-module.test.js, test/mutants/settings-foundation.mutants.json
- FOUND commits: 756aea5, b830cc5, e35d739, f11d64c

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
