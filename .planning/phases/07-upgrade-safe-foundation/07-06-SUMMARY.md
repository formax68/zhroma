---
phase: 07-upgrade-safe-foundation
plan: 06
subsystem: settings
tags: [mv3, content-script, chrome-storage-local, settings-gate, storage-onchanged, parity, vitest, tracer-world]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-03 Zhroma.settings registry (keys, defaultOf, resolve) loaded first in content_scripts[0].js
  - phase: 07-upgrade-safe-foundation
    provides: 07-04 worker settings queue and the tracer settings read seam (setSettingsReadMode, flushSettingsReads, settingsReadCount, hang)
  - phase: 07-upgrade-safe-foundation
    provides: 07-01 parity harness, extended here with three stored-theme states
provides:
  - content.js SETTINGS_READ_TIMEOUT_MS = 500, settingsApi, settingsReady, settingsTimer, per-key settingsGenerations and settingsState maps
  - content.js readSettings, landSettings, resolveSetting, unreadableSetting, openSettingsGate, onSettingsChanged, onStorageChanged
  - runnable() is preferenceReady && preferenceEnabled && settingsReady && !suspended && !document.hidden
  - chrome-harness SETTINGS_CONTRACT, settingsStored / settingsReadMode options, settingsReadCount, settingsPendingCount, setSettingsStored, clearSettingsStored
  - test/extension/settings-reader.test.js (29 tests) with the markers [mutant:settings-gate-bound], [mutant:settings-failure-opens-gate], [mutant:settings-gate-required]
  - parity STATES 'theme stored Classic', 'theme unreadable (newer version)', 'settings read fails' (108 matrix cases)
affects: [07-07 upgrade-storage and content-side mutants, 07-08 tsc checkJs, 08-themes (first consumer of settingsState theme)]

actuals:
  tokens: 9000
  tasks: 2
  commits: 3
plan_head_before: 71f93c63734018f9bff6c0ccd4c03acc9e662c97
plan_head_after: 64927bfe9d4498dd5a37b75f56cc090a89540d85

tech-stack:
  added: []
  patterns:
    - "A non-blocking settings gate: its own read, a single time-bound timer armed only while the gate is closed, and success or failure both open it"
    - "Opening the gate syncs the controller only once the preference has landed, so the v1 startup message sequence is unchanged"
    - "One dispatching storage listener: the settings handler inside try/catch first, then the unchanged enabled handler"
    - "The chrome-harness settings seam shares the FIFO but is tagged, so v1 readCount/pendingCount still count only the enabled read"

key-files:
  created:
    - test/extension/settings-reader.test.js
  modified:
    - extension/content.js
    - test/extension/chrome-harness.js
    - test/extension/parity.test.js

key-decisions:
  - "A failed settings read is modelled as a null landing (lastError, a thrown call, or a non-object values argument); every key then resolves to its default with status unreadable"
  - "readSettings snapshots per-key generations without bumping them; only a change event bumps a key, so two overlapping reads both land in issue order and a change is never overwritten by an earlier read"
  - "onSettingsChanged lets a throwing change escape to onStorageChanged's catch rather than catching per key; with one registered key this is equivalent, and the enabled handler still runs"
  - "The D-14 no-re-evaluation proof also spies on document.querySelectorAll: commitSnapshot skips writes for unchanged markers, so a marker-write spy alone would not catch a re-sync"

patterns-established:
  - "Tests that need the settings time bound use the strict harness with fake timers; tracer-world tests avoid depending on the bound so a gate-bound mutant fails exactly one marked test"

requirements-completed: [COMPAT-01, COMPAT-04, DATA-01]

coverage:
  - id: D1
    description: "The content script reads ['theme'] once, before the enabled read; tinting waits for that read, never longer than 500 ms, and every timer it arms is cleared"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a hung settings read holds rows untinted for at most the time bound, then tints and leaves no timer"
        status: pass
      - kind: integration
        ref: "test/extension/settings-reader.test.js#the first tint waits for the settings read even when the preference is already confirmed"
        status: pass
      - kind: unit
        ref: "test/extension/settings-reader.test.js#the settings contract agrees with the shipped registry, with content.js and with the tracer read"
        status: pass
    human_judgment: false
  - id: D2
    description: "Empty storage, null, {}, a bare string, an unknown id, a newer v, and a rejected, rejected-with-values or throwing read all tint exactly as 0.1.0 with no wait and no storage write"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a %s settings read tints with no wait (3 cases)"
        status: pass
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a stored theme of %s tints exactly as 0.1.0 does, and nothing is written (7 cases)"
        status: pass
    human_judgment: false
  - id: D3
    description: "enabled keeps its behaviour: a stored false stays dormant under every settings mode, the settings read never opens an unconfirmed document, and the ten enabled-path functions are byte-identical to 6d3ab0b"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a stored false stays dormant whatever the settings read does (%s) (6 cases)"
        status: pass
      - kind: integration
        ref: "test/extension/settings-reader.test.js#the settings read never opens a document whose preference is unconfirmed"
        status: pass
      - kind: other
        ref: "ENABLED_PATH_UNCHANGED node check from the plan's Task 1 verify"
        status: pass
    human_judgment: false
  - id: D4
    description: "D-14 end to end: a theme saved from the popup over an unreadable stored theme reaches the content listener in the local area with zero marker writes, removals or table scans; toolbar and popup unchanged"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a theme saved through the worker over an unreadable stored theme reaches the page and changes nothing visible (D-14)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Exactly one storage listener, which ignores other areas and unrelated keys, treats a removal as the default, and lets an enabled change through when the settings handling throws"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a theme change in another area, an unrelated key and a removed theme change nothing visible"
        status: pass
      - kind: integration
        ref: "test/extension/settings-reader.test.js#a settings change that throws on access still lets the off switch through"
        status: pass
      - kind: integration
        ref: "test/extension/settings-reader.test.js#the content script still registers exactly one storage listener in both doubles"
        status: pass
    human_judgment: false
  - id: D6
    description: "DATA-01: across the settings-reader tracer tests world.forbidden is empty, the content script writes nothing, and no message or response other than the popup's own set-setting exchange names a key, value or status"
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "test/extension/settings-reader.test.js (expectNoSettingsTraffic and forbidden checks in every tracer test)"
        status: pass
    human_judgment: false
  - id: D7
    description: "COMPAT-01: parity holds under six states, including theme stored Classic, theme unreadable (newer version) and settings read fails"
    requirement: COMPAT-01
    verification:
      - kind: integration
        ref: "test/extension/parity.test.js#%s under %s (108 cases)"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon -> 31 files, 1431 Vitest tests, 112 node tests, exit 0"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 06: Content Settings Reader and Gate Summary

**The content script now reads `['theme']` once at startup and resolves it through the shared registry. Priority tinting waits for that read, success or failure, and never longer than 500 ms. Any failure falls back to the Classic default with no wait. One dispatching storage listener re-resolves a saved theme without touching a row, and the `enabled` path is byte-identical to 0.1.0.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-09-28T09:11:47Z
- **Completed:** 2026-09-28T09:20:55Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- `content.js` reads `globalThis.Zhroma?.settings` once. When the shared file is not loaded, the gate starts open and no settings read is issued, so `content.js` on its own behaves as 0.1.0.
- `readSettings()` runs just before `readPreference()` in `startPersistentTint` and after it in `onPageShow`. It arms the 500 ms timer only while the gate is closed. The callback passes `chrome.runtime.lastError ? null : values` to `landSettings`. That form does not reproduce the registered `content-lasterror` literal.
- `openSettingsGate()` clears the timer, opens the gate once, and calls `syncController()` only if the preference has already landed. With the harness FIFO (settings first), the startup message sequence matches 0.1.0.
- `onStorageChanged` is still the only storage listener. It runs `onSettingsChanged` inside try/catch, then the unchanged `onPreferenceChanged`. `onSettingsChanged` bumps the key's generation and re-resolves `newValue`, treating a removal as the default. It never syncs.
- `chrome-harness.js` admits `get(['theme'], fn)` as a separate, tagged seam in the shared FIFO. Any other array or string form is a recorded violation.
- Final checks:
  - full recon suite: 1431 Vitest tests and 112 node tests pass;
  - mutation gate: 47/47 killed;
  - `ENABLED_PATH_UNCHANGED`.

## Task Commits

1. **Task 1: The content script reads settings at startup and tints only once that read settles (tracer)**
   - `ec60683` (test): the chrome-harness settings seam and `SETTINGS_CONTRACT`, committed separately as a test-double change
   - `daf4c68` (feat): the reader, the gate and its time bound, and the first 25 settings-reader tests
2. **Task 2: The change listener, the D-14 end-to-end theme path and the stored-theme parity states** - `64927bf` (feat)

Tracer gate: interactive `end-of-phase` mode, and Task 1's verify is automated-only. That verify was re-run and passed (8 files, 390 tests, plus `ENABLED_PATH_UNCHANGED`), so the plan went on to Task 2.

## Files Created/Modified
- `extension/content.js` - Adds the settings constant, state and functions. `runnable` gains `settingsReady &&`. `onPageShow` and `startPersistentTint` each gain one `readSettings()` call, and the storage listener is now `onStorageChanged`.
- `test/extension/chrome-harness.js` - Adds the settings seam, `SETTINGS_CONTRACT`, the new options and the counters. The object-form branch and the `flush` delivery-limit line are unchanged.
- `test/extension/settings-reader.test.js` - 29 tests: agreement, harness admission and modes, time bound, failure shapes, the stored-theme rejection table, gate, off switch, bfcache round trip, the D-14 end-to-end path, listener filtering, the throwing change and listener count.
- `test/extension/parity.test.js` - Three stored-theme states appended. The matrix-shape test now lists six state names; its title changed with it, and no mutant references that title.

## Decisions Made
- A null landing (lastError, a thrown `get`, or a non-object `values`) resolves every key to its default with status `unreadable` (D-08). A key that is simply absent resolves to its default with status `default`.
- `readSettings` snapshots the per-key generations but does not bump them. Only a change event bumps a key.
- The D-14 test also spies on `document.querySelectorAll`. `commitSnapshot` skips writing a marker that is already correct, so a marker-write spy alone would pass even if the change re-synced the controller. This was checked by hand: adding `syncController(true)` to `onSettingsChanged` makes the D-14 test fail on the scan spy.

## Notes for Plan 07-07 (mutant targets)

Each mutant below was measured by hand against a scratch copy of `content.js`. None is registered yet.

| Mutant | Failing test(s) | Marker |
|--------|-----------------|--------|
| settings-gate-bound (remove the timer) | only `a hung settings read holds rows untinted for at most the time bound, then tints and leaves no timer` | `[mutant:settings-gate-bound]` |
| settings-failure-opens-gate: `catch { landSettings(null, generations); }` becomes `catch { }` | only `a throws settings read tints with no wait` | `[mutant:settings-failure-opens-gate]` |
| settings-failure-opens-gate: `if (!chrome.runtime.lastError) landSettings(values, generations);` | `a rejected ...` and `a rejected-with-values settings read tints with no wait` | `[mutant:settings-failure-opens-gate]` |
| settings-gate-required (drop `settingsReady && `) | `the first tint waits for the settings read even when the preference is already confirmed`, plus the hung-read test (its 499 ms assertion carries the same marker) | `[mutant:settings-gate-required]` |

`verify-mutation-kills.js` fails with `unrelated-assertion-failed` if any failing test is missing from a mutant's targets, so the two-test rows need both tests listed.

## Deviations from Plan

**1. [Rule 1 - Test fidelity] The unconfirmed-preference tracer test uses an immediate settings read, not a hung one**
- **Found during:** Task 1 (hand-measuring the mutants)
- **Issue:** The first draft used a hung settings read and waited out the bound. Under the gate-bound mutant it then failed on an unmarked assertion, which would block registering that mutant in 07-07.
- **Fix:** The test now lets the settings read land, opening the gate, while the preference stays in flight. It checks that the page stays untinted and tints only once the preference lands. The time bound is proven only by the harness test.
- **Files modified:** test/extension/settings-reader.test.js
- **Committed in:** daf4c68

**2. [Process] The HEAD safety check reports `main` as protected.** Commits went to `main` as directed (`branching_strategy: none`), as in 07-01 to 07-05.

---

**Total deviations:** 1 auto-fixed (test fidelity), 1 procedural
**Impact on plan:** None on the delivered contract. Every truth, artifact and key link in the plan is met.

## Issues Encountered
- A test that mixes the fake-timer harness with the tracer world must call `vi.useRealTimers()` before tracer `settle()`. Otherwise the tracer's ticks never run and the test times out.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 07-07 can register the three content-side mutants against the tests in the table above, and add the upgrade-state proofs (COMPAT-02, D-04, D-27).
- Phase 8 can read `settingsState.get('theme').value` inside content.js as the effective theme id. The per-key `status` is available for the D-12 wording decision.

## Self-Check: PASSED
- FOUND: extension/content.js, test/extension/chrome-harness.js, test/extension/settings-reader.test.js, test/extension/parity.test.js
- FOUND commits: ec60683, daf4c68, 64927bf

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
