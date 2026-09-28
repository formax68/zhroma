---
phase: 07-upgrade-safe-foundation
plan: 04
subsystem: settings
tags: [mv3, service-worker, write-queue, compare-and-swap, chrome-storage-local, vitest, tracer-world, mutation-testing]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-03 Zhroma.settings registry (resolve, parseValue, encode, equal, cas), the guarded worker importScripts and the tracer loaders
  - phase: 07-upgrade-safe-foundation
    provides: 07-01 parity harness and frozen contract, kept green here
provides:
  - Zhroma.settings.OUTCOMES (saved, unchanged, rejected, conflict, failed, unknown)
  - Zhroma.settings.createQueue({ registry, read, write, timeoutMs, maxPending, setTimer, clearTimer, now }) returning a frozen { admit, size }
  - background.js readSetting, writeSetting, MAX_PENDING_SETTINGS = 32, one settings queue, and a fourth onMessage branch for set-setting from the packaged popup
  - reply shape { type: 'set-setting', requestId, outcome, revision } (revision null for last-writer-wins keys)
  - tracer-world settings read seam (settingsReadMode, setSettingsReadMode, flushSettingsReads, pendingSettingsReadCount, settingsReadCount, stages worker-settings-read and content-settings-read) and recorded sync/session/managed denies
  - test/extension/settings-queue.test.js
  - test/mutants/settings-foundation.mutants.json with five measured-killed mutants
affects: [07-05 D-17 sender checks, 07-06 content settings reader, 07-07 upgrade-storage, 07-08 tsc checkJs, 08-themes popup picker, 10-options page]

actuals:
  tokens: 11316
  tasks: 2
  commits: 5
plan_head_before: 55b4fb9ce48417099a5cf64c643d764d559b7574
plan_head_after: 44d18b9b110ac14a62bc46be85c0d4b6842e9eff

tech-stack:
  added: []
  patterns:
    - "Pure queue factory in the shared module, handed its read, write and timer functions, so tests inject cas keys with no test hook in shipped code"
    - "Settings reads are a separate seam in the tracer double (array-form get), so v1 preference read counts are unchanged"
    - "A deadline answers the requester but never cancels an issued write: the writer is released only when the physical write settles"

key-files:
  created:
    - test/extension/settings-queue.test.js
    - test/mutants/settings-foundation.mutants.json
  modified:
    - extension/zhroma-settings.js
    - extension/background.js
    - test/extension/tracer-world.js
    - test/extension/toolbar-popup.test.js
    - test/extension/settings-module.test.js

key-decisions:
  - "createQueue's timer options are named setTimer and clearTimer, not setTimeout and clearTimeout. The 07-03 purity pin forbids the global timer names in zhroma-settings.js, and the module still uses no global timer. background.js wraps setTimeout, clearTimeout and Date.now in arrows so Chrome never sees an unbound call"
  - "Reply revision for a cas key: the new revision after saved, the current stored revision after conflict, and otherwise the revision the request carried (null when it carried none that is valid)"
  - "The worker gate accepts set-setting only in the exact shape: revision present exactly for a cas key, as a non-negative safe integer, and a known key. Without the module, the outer shape from the popup is answered failed synchronously"
  - "An unreadable stored value is replaced when the agent saves any valid value (assumption A1). Only a readable value equal to the choice is skipped (D-11)"

patterns-established:
  - "Settings write path: one queue, one read primitive (array-form get), one write primitive (chrome.storage.local.set({ [key]: stored }))"
  - "A mutant whose kill lands on an unmarked assertion is taken out, and its test is reordered so the marked guard is checked first, before the mutant is registered"

requirements-completed: [DATA-01, COMPAT-02, COMPAT-03, COMPAT-04]

coverage:
  - id: D1
    description: "A theme choice from the popup over an unreadable stored theme is validated, written once as { v: 1, id: 'zhroma-classic' } to storage.local, answered saved and announced in the local area; fresh install and stored Classic answer unchanged with no write"
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#a theme choice from the popup over an unreadable stored theme is validated, written once to storage.local and announced"
        status: pass
      - kind: integration
        ref: "test/extension/settings-queue.test.js#re-selecting Classic on a fresh install writes nothing and answers unchanged (D-11)"
        status: pass
      - kind: integration
        ref: "test/extension/settings-queue.test.js#re-selecting Classic over a stored Classic writes nothing and answers unchanged (D-11)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Queue guarantees with injected keys: arrival order with no overlap, the writer held across an unknown deadline, the D-11 skip and explicit default, cas revision + 1 and conflict, rejected before any read, failed on read failure, write failure, full queue and deadline, one reply per admit"
    requirement: COMPAT-03
    verification:
      - kind: unit
        ref: "test/extension/settings-queue.test.js#three back-to-back writes are applied in arrival order with no overlapping physical write"
        status: pass
      - kind: unit
        ref: "test/extension/settings-queue.test.js#the next job waits for the previous physical write even after that requester was answered unknown"
        status: pass
      - kind: unit
        ref: "test/extension/settings-queue.test.js#a cas key saves with revision + 1 only when the request holds the stored revision (D-16)"
        status: pass
      - kind: unit
        ref: "test/extension/settings-queue.test.js#at the deadline a job still queued and a job whose read is in flight answer failed and never write"
        status: pass
    human_judgment: false
  - id: D3
    description: "No write the agent did not choose: the value already in effect writes nothing, a failed read never writes, a read in flight at the deadline never writes"
    requirement: COMPAT-02
    verification:
      - kind: unit
        ref: "test/extension/settings-queue.test.js#the value already in effect writes nothing, and switching back to the default writes it explicitly (D-11)"
        status: pass
      - kind: unit
        ref: "test/extension/settings-queue.test.js#a failed read answers failed and never writes, whether it reports failure, rejects or throws"
        status: pass
    human_judgment: false
  - id: D4
    description: "Local only at the worker: after a settings sequence only storage.local was written, one key per write, the sync/session/managed denies were never reached, and nothing forbidden fired"
    requirement: DATA-01
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#after a sequence of settings operations only storage.local was written, one key per write (DATA-01)"
        status: pass
    human_judgment: false
  - id: D5
    description: "v1 shapes and the enabled path unchanged: interleaved set-enabled and set-setting both succeed, enabled writes stay the one boolean, the ten enabled-path functions are byte-identical to 6d3ab0b, and parity and the frozen contract pass"
    requirement: COMPAT-04
    verification:
      - kind: integration
        ref: "test/extension/settings-queue.test.js#interleaved off-switch and settings requests both succeed, and enabled writes stay the one boolean"
        status: pass
      - kind: other
        ref: "ENABLED_PATH_UNCHANGED node check from the plan's Task 1 verify"
        status: pass
      - kind: integration
        ref: "test/extension/parity.test.js and test/extension/frozen-contract.test.js (unchanged, green)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Five D-30 mutants registered only after each was measured killed; the full gate passes 44/44"
    verification:
      - kind: other
        ref: "node scripts/verify-mutation-kills.js --only <id> for each of the five ids -> ALL_NEW_WORKER_MUTANTS_KILLED"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js -> MUTATION KILLS: 44/44 killed"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 04: Worker Settings Queue Summary

**The worker is now the single, serial and validated writer of settings. A pure `createQueue` in the shared module handles serialisation, cas compare, the D-11 skip and deadlines. It writes through one `chrome.storage.local.set({ [key]: stored })` primitive, and `set-setting` is admitted only from the packaged popup. The `enabled` path is byte-identical to 0.1.0. Five new mutants were measured killed before registration.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-28T08:39:12Z
- **Completed:** 2026-09-28T08:51:19Z
- **Tasks:** 2
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments
- `Zhroma.settings.createQueue` runs one job at a time and gives exactly one frozen reply per admit:
  - `rejected` at once, before any read, for an invalid value, an oversized stored form, a revision that does not fit the key, or an unregistered key;
  - `failed` at once when the queue is full (queued plus active jobs reach `maxPending`);
  - `failed` for a read failure (reported, rejected or thrown), a write failure, or a deadline before the write;
  - `unknown` when the deadline passes during the physical write.

  A failed read never leads to a write. Neither does a read that is still in flight at the deadline. The next job starts only after the previous physical write has settled.
- The cas compare runs inside the drained job, against the revision just read. A save stores revision + 1, and a stale revision answers `conflict` with the current revision. An unreadable stored value is replaced by a save (A1). A readable value equal to the choice is skipped (D-11).
- `background.js` adds `readSetting`, `writeSetting`, `MAX_PENDING_SETTINGS = 32` and one queue, all after `setEnabled` and outside every existing function body. The three v1 onMessage branches keep their order, and the `set-setting` branch comes fourth. Without the module, the popup gets `failed` synchronously.
- In the tracer world, the array-form `get` is now a separate settings read seam. The v1 preference read seam is unchanged, so every existing read-count assertion still holds. `local.set` now stores clones, and sync, session and managed access is recorded as forbidden.
- The full suite passes: 1342 Vitest tests plus the node smoke tests, exit 0. The full mutation gate passes 44/44.

## Task Commits

1. **Task 1: A theme write from the popup reaches storage.local through the worker queue (tracer)**
   - `ad980c1` (test): tracer-world settings read seam and area denies, a separate test-double commit
   - `c5097fb` (feat): createQueue and OUTCOMES, the worker wiring, and the tracer tests
   - `c7e8e26` (test): restate the settings namespace member pin (own commit, see Deviations)
   - `2e98efe` (test): restate the v1 worker storage-surface pin (own commit, D-25)
2. **Task 2: Queue guarantees, the local-only proof and the D-30 mutants** - `44d18b9` (test)

The tracer feedback gate ran in interactive `end-of-phase` mode with an automated-only verify. The verify was re-run and passed (8 files, 497 tests, plus `ENABLED_PATH_UNCHANGED`), so the plan went on to expansion.

## Files Created/Modified
- `extension/zhroma-settings.js` - `OUTCOMES`, `createQueue`, and the JSDoc typedefs `Outcome`, `SettingRequest`, `SettingReply`, `ReadResult`, `QueueOptions` and `SettingsQueue`. It passes `tsc 7.0.2 --checkJs --strict`.
- `extension/background.js` - The settings block (`settingsApi`, `MAX_PENDING_SETTINGS`, `readSetting`, `writeSetting`, `settingsQueue`, `settingsRequest`) and the fourth onMessage branch.
- `test/extension/tracer-world.js` - The settings read seam, recorded area denies, and cloned, serialisation-compared writes.
- `test/extension/settings-queue.test.js` - 33 tests: the tracer path, the queue guarantees with injected keys, and the worker-level local-only, serial, interleaving and refusal cases.
- `test/mutants/settings-foundation.mutants.json` - `settings-queue-serial`, `settings-writer-ownership`, `settings-cas-compare`, `settings-skip-unchanged`, `settings-local-area`.
- `test/extension/toolbar-popup.test.js`, `test/extension/settings-module.test.js` - Restated pins.

## Decisions Made
- The timer options are named `setTimer`/`clearTimer`, not the plan's `setTimeout`/`clearTimeout`. See the Deviations section.
- For a cas key, the reply revision is the new revision after `saved` and the current revision after `conflict`. Otherwise it is the revision the request carried.
- The worker gate refuses any `set-setting` that is not in the exact shape. It gives no reply to a revision on `theme`, an unknown key, an extra member, an out-of-range id, a content sender or a foreign id.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Timer option names changed to fit the 07-03 purity pin**
- **Found during:** Task 1
- **Issue:** `settings-module.test.js` forbids the literal `setTimeout` anywhere in `zhroma-settings.js` ("no ... timer"). Taking options named `setTimeout`/`clearTimeout` would have broken that pin.
- **Fix:** The options are `setTimer`/`clearTimer`. The module still references no global timer. `background.js` passes `(callback, ms) => setTimeout(callback, ms)` and `(handle) => clearTimeout(handle)`, which also avoids an unbound native call in Chrome.
- **Files modified:** extension/zhroma-settings.js, extension/background.js
- **Committed in:** c5097fb

**2. [Rule 3 - Blocking] The 07-03 namespace member pin was restated in its own commit**
- **Found during:** Task 1
- **Issue:** `settings-module.test.js` pins `Object.keys(Zhroma.settings)` to five members. Adding `OUTCOMES` and `createQueue` makes it seven. The plan's files list did not name this test.
- **Fix:** A test-only commit (`c7e8e26`) restates the list with the reason and adds `OUTCOMES` to the frozen-value check. The pin was not mixed with feature code (D-06).
- **Files modified:** test/extension/settings-module.test.js
- **Committed in:** c7e8e26

**3. [Process] Writer-ownership mutant: its first measurement did not count as a kill**
- The mutant made the test fail, but the failure landed on an unmarked replies assertion (`intended-assertion-not-proven`). It was taken out of the file. The test was reordered so the marked guard (the second job must not read yet) is checked first, and the replies assertion also carries the marker. The mutant was then re-measured `1/1 killed` and kept (D-30).

**4. [Process] The HEAD safety check reports `main` as protected.** Commits went to `main` as directed, with `branching_strategy: none`, the same as 07-01 to 07-03.

---

**Total deviations:** 2 auto-fixed (blocking), 2 procedural
**Impact on plan:** None on the delivered contract. The message shape, reply shape, stored form and outcome set are as planned. The only change is the names of two injected options.

## Issues Encountered
- A cross-realm `TypeError` does not pass `toThrow(TypeError)`, so the options-refusal test matches the `Zhroma settings:` message instead.
- `settings-queue.test.js` needs `// @vitest-environment node`, like the other tracer-world suites, because happy-dom's `URL` refuses `file:` URLs.

## Verification
- Task 1 verify: 8 files, 497 tests pass. `ENABLED_PATH_UNCHANGED`.
- Task 2 verify: `settings-queue` and `mutation-registry` pass 42 tests. The five `--only` runs print `ALL_NEW_WORKER_MUTANTS_KILLED`.
- `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon`: exit 0, 30 files, 1342 Vitest tests.
- `node scripts/verify-mutation-kills.js`: `MUTATION KILLS: 44/44 killed`. The 39 v1 mutants and all 5 new ones are killed (D-25).
- Acceptance greps: `createQueue` and `OUTCOMES` are present with the six strings. `chrome.storage.local.set({ [key]: stored }` appears once. The tracer names are present. `toolbar-popup.test.js` contains `['get', 'get', 'set', 'set']` and `'{ [key]: stored }'`.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 07-05 can widen the `set-setting` sender gate to `fromPopup(sender) || fromOptions(sender)` and append the three D-17 mutants to `settings-foundation.mutants.json`. The branch is one `if` after the three v1 branches.
- 07-06 can use the tracer's `content-settings-read` stage, `setSettingsReadMode(mode, 'content')` and the `hang` mode for the `settingsReady` time bound.
- 07-07's `unchanged` reply over `enabled`-only storage is already how the queue behaves: an absent key resolves as the default, not as unreadable.

## Self-Check: PASSED
- FOUND: extension/zhroma-settings.js, extension/background.js, test/extension/tracer-world.js, test/extension/settings-queue.test.js, test/mutants/settings-foundation.mutants.json
- FOUND commits: ad980c1, c5097fb, c7e8e26, 2e98efe, 44d18b9

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
