---
phase: 07-upgrade-safe-foundation
plan: 03
subsystem: settings
tags: [mv3, classic-script, namespace, settings-registry, options-ui, vitest, tracer-world]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: 07-01 parity harness (parity.test.js) and frozen contract (frozen-contract.test.js), kept green here
provides:
  - extension/zhroma-settings.js, the shared classic-script namespace Zhroma with Zhroma.settings (STATUSES, THEME_IDS, ENTRIES, define, registry)
  - registry members keys, has, cas, defaultOf, resolve, parseValue, encode, equal; one shipped key, theme, Classic only
  - extension/options.html static stub and the manifest options_ui entry
  - background.js guarded importScripts('zhroma-settings.js') as its first statement
  - RELEASE_FILES at 14 files
  - tracer-world.js NAMESPACE export, loadContent scripts option (manifest order), loadWorker imports option with an admitting importScripts
  - test/extension/settings-module.test.js
affects: [07-04 worker settings queue, 07-05 content settings reader, 07-08 tsc checkJs, 08-themes, 09-colouring-rules, 10-rule-editor]

actuals:
  tokens: 15063
  tasks: 3
  commits: 3
plan_head_before: e9b71f6485085c3ce00b016a143e0b7f0da4d77d
plan_head_after: 83779d8e755a63c05af780a04afcb72a70dafbf7

tech-stack:
  added: []
  patterns:
    - "Shared classic script: one IIFE, one non-writable non-configurable global (Zhroma), frozen members, idempotent reload"
    - "Stored settings are untrusted: resolve works on a JSON deep copy, builds parse payloads as null-prototype objects via defineProperty, and never writes back"
    - "Worker double admits importScripts only for packaged top-level .js files read from the extension directory"

key-files:
  created:
    - extension/zhroma-settings.js
    - extension/options.html
    - test/extension/settings-module.test.js
  modified:
    - extension/manifest.json
    - extension/background.js
    - scripts/release-source.js
    - test/extension/tracer-world.js
    - test/extension/runtime-contract.test.js
    - test/extension/toolbar-popup.test.js
    - test/extension/release-package.test.js

key-decisions:
  - "Flat layout: the shared file is extension/zhroma-settings.js, not extension/lib/; the global is Zhroma and settings hangs off it, so later shared files attach sibling members"
  - "Registry methods throw a TypeError for an unregistered key; an unknown key is a programming error, not stored data"
  - "resolve() also treats symbol or non-enumerable own keys, and keys that do not survive a JSON round trip (undefined values), as unreadable, and wraps inspection in try so any throwing stored value is unreadable"
  - "encode() returns only a form that resolve() accepts as stored; define() also refuses an entry whose default cannot be encoded within its maxBytes"
  - "The Chrome API allowlist in runtime-contract.test.js needed no restatement: zhroma-settings.js names no chrome.* path and importScripts is not one"

patterns-established:
  - "New shared files begin with // @ts-check and JSDoc @typedef; zhroma-settings.js passes tsc 7.0.2 --checkJs --strict unmodified"
  - "Pins moved by a feature land in one later test-only commit whose body lists each pin and its reason"

requirements-completed: [COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04]

coverage:
  - id: D1
    description: "Shared namespace: exactly one global Zhroma, non-writable and non-configurable, frozen settings, idempotent reload, existing namespace reused"
    requirement: COMPAT-03
    verification:
      - kind: unit
        ref: "test/extension/settings-module.test.js#loading the shipped file adds exactly one global, Zhroma, bound non-writable and non-configurable"
        status: pass
      - kind: unit
        ref: "test/extension/settings-module.test.js#evaluating the file twice changes nothing and throws nothing"
        status: pass
    human_judgment: false
  - id: D2
    description: "Theme registry and resolver: absent means default, stored Classic is stored, and every rejection-table value (including own __proto__, bad v, newer v, oversized, array) resolves to the default as unreadable without mutating its input"
    requirement: COMPAT-02
    verification:
      - kind: unit
        ref: "test/extension/settings-module.test.js#%s resolves to the Classic default as unreadable, without touching the stored value (20 cases)"
        status: pass
      - kind: unit
        ref: "test/extension/settings-module.test.js#an absent theme resolves to Classic by default, and the stored Classic form resolves as stored"
        status: pass
    human_judgment: false
  - id: D3
    description: "Per-key versions and compare-and-swap seam: in-memory migration only, newer versions never migrated down, revision from rev, UTF-8 size caps, define rejection table, encode/parseValue/equal"
    requirement: COMPAT-02
    verification:
      - kind: unit
        ref: "test/extension/settings-module.test.js#an older stored version migrates in memory only, and the stored object is left unchanged"
        status: pass
      - kind: unit
        ref: "test/extension/settings-module.test.js#a newer stored version is unreadable and is never migrated down"
        status: pass
      - kind: unit
        ref: "test/extension/settings-module.test.js#define throws a TypeError for %s (25 cases)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Module loads first in the content world and the worker; a failed worker import leaves the working toolbar and the off switch intact"
    requirement: COMPAT-01
    verification:
      - kind: integration
        ref: "test/extension/settings-module.test.js#the content world and the worker both load the module first, as Chrome does, with nothing forbidden"
        status: pass
      - kind: integration
        ref: "test/extension/settings-module.test.js#with the import failing, the worker still projects the working toolbar and still saves the off switch"
        status: pass
      - kind: integration
        ref: "test/extension/parity.test.js (65 tests, unchanged, against the new bytes)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Static options stub, options_ui entry, 14-file RELEASE_FILES, and the v1 pins restated in one test-only commit"
    requirement: COMPAT-04
    verification:
      - kind: unit
        ref: "test/extension/runtime-contract.test.js#the options stub is a static page with exactly one fixed sentence"
        status: pass
      - kind: unit
        ref: "test/extension/runtime-contract.test.js#the shared settings module is a classic script with no module syntax, network, storage, DOM write or colour"
        status: pass
      - kind: other
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon (112 node smoke + 1309 Vitest, exit 0)"
        status: pass
      - kind: other
        ref: "node scripts/verify-mutation-kills.js -> MUTATION KILLS: 39/39 killed"
        status: pass
      - kind: other
        ref: "git diff-tree of 83779d8 lists only test/extension/ paths"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 03: Settings Module and Packaged Shape Summary

**A frozen `Zhroma.settings` registry (theme key, Classic only, stored as `{ v: 1, id: 'zhroma-classic' }`) whose resolver treats every stored value as untrusted and never writes it back. It loads first in the content world and through a guarded worker `importScripts`. A static `options.html` stub is also added, which brings RELEASE_FILES to 14 files, and every moved v1 pin is restated in one test-only commit.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-09-28T08:24:02Z
- **Completed:** 2026-09-28T08:36:00Z
- **Tasks:** 3
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments
- `extension/zhroma-settings.js` is one `'use strict'` IIFE. It defines a single enumerable, non-writable, non-configurable `Zhroma` global and attaches a frozen `settings` member. Loading it twice is a no-op. If an earlier shared file already created the namespace, it is reused. The file references no DOM, extension API, storage or timer, and it passes `tsc 7.0.2 --checkJs --strict` as written.
- `resolve(key, present, raw)` always returns a fresh frozen `{ value, status, revision }`. It works on a JSON deep copy of the stored value and hands `parse` a null-prototype payload built with `defineProperty`. That means an own `__proto__` key can never become a prototype. Oversized values (counted in UTF-8 bytes by hand), non-plain values, bad or newer `v`, missing or failing migrations and rejected payloads all resolve to the default with status `unreadable`. Older versions are migrated in memory only.
- `define(entries)` rejects the reserved key `enabled`, duplicate keys, malformed keys, versions, cas flags, maxBytes, parse/fields functions and migrations, and any default that does not survive `parse(fields(default))` or cannot be encoded within its cap. An injected `note` key (cas, version 2, migration from 1) works with no change to any other code.
- The manifest lists `zhroma-settings.js` before `content.js` and adds `options_ui { page: 'options.html', open_in_tab: true }`. The version is still 0.1.0 and the permission surface is unchanged. `background.js` now starts with a guarded import. If that import throws, the worker still projects the working toolbar and still saves the off switch (tested).
- The tracer world loads content scripts in manifest order and admits worker `importScripts` only for packaged top-level `.js` files, read from the directory. Anything else is recorded as forbidden. `imports: 'throws'` models a failed import.
- The parity harness and the frozen contract from 07-01 pass unchanged. `popup.js`, `popup.html`, `zhroma.css`, `icons/` and `content.js` are byte-identical to 6d3ab0b. The mutation gate passes 39/39.

## Task Commits

1. **Task 1: The settings module loads first in the content world and the worker (tracer)** - `d21f08d` (feat)
2. **Task 2: The static options stub and the packaged inventory** - `9b0b274` (feat)
3. **Task 3: Restate the v1.0 inventory, manifest and global pins (own commit)** - `83779d8` (test, touches only test/extension/)

The tracer feedback gate ran in interactive `end-of-phase` mode with an automated-only verify. The verify was re-run and passed (11 files, 599 tests), so the plan went on to expansion.

## Files Created/Modified
- `extension/zhroma-settings.js` - The shared namespace and settings registry, with the JSDoc typedefs `SettingStatus`, `SettingEntry`, `Resolved` and `Registry`.
- `extension/options.html` - A static stub with the sentence "Zhroma needs no setup. There is nothing to change here." It has no script.
- `extension/manifest.json` - `options_ui`, and `zhroma-settings.js` placed first in `content_scripts[0].js`.
- `extension/background.js` - A guarded `importScripts('zhroma-settings.js')` as the first statement. Nothing else changed.
- `scripts/release-source.js` - `options.html` and `zhroma-settings.js` added to RELEASE_FILES, each with a `// 07-03:` reason.
- `test/extension/tracer-world.js` - `NAMESPACE`, the `loadContent` `scripts` option, the `loadWorker` `imports` option, an admitting `importScripts`, and an `EventSource` sentinel in the worker.
- `test/extension/settings-module.test.js` - 68 tests: namespace, source purity, registry, rejection tables, migration, CAS revision, size caps, define rejection, encode/parseValue/equal, both loaders and the failed-import flow.
- `test/extension/runtime-contract.test.js`, `test/extension/toolbar-popup.test.js`, `test/extension/release-package.test.js` - The restated pins, plus two new versioned tests (settings-module purity and a static options stub).

## Decisions Made
- The layout is flat: `extension/zhroma-settings.js`. The namespace is `Zhroma`, with `settings` as its first member.
- Registry lookups for an unregistered key throw a `TypeError`. Only registered keys reach the resolver.
- Extra hardening in the resolver, all under T-07-07. Symbol and non-enumerable own keys are refused. So are keys lost in a JSON round trip, such as undefined values. Any throw during inspection means `unreadable`. `encode` returns only forms that `resolve` accepts as `stored`.
- The Chrome API allowlist was not restated. The new file names no `chrome.*` path, and `importScripts` is not a `chrome.*` path, so the 07-01 note about restating the allowlist turned out not to apply.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Resolver and define hardening beyond the listed rejection cases**
- **Found during:** Task 1
- **Issue:** The planned checks allowed three gaps. A stored value with an `undefined`-valued extra key would pass, because JSON drops the key. Non-enumerable keys and throwing getters or proxies were not covered. A default could exceed its own size cap.
- **Fix:** Compare key counts across the JSON copy and `Reflect.ownKeys`. Wrap inspection in try so a throw means `unreadable`. `define` encodes each default. `encode` re-resolves its own output.
- **Files modified:** extension/zhroma-settings.js
- **Verification:** New rejection-table rows ('an extra key holding undefined', 'a non-enumerable extra key', 'a default larger than the cap') pass.
- **Committed in:** d21f08d

**2. [Process] The HEAD safety check reports `main` as protected**
- Commits went to `main`, as the orchestrator directed. `branching_strategy` is `none`, and 07-01 and 07-02 did the same. Nothing was forced or rewritten.

---

**Total deviations:** 1 auto-fixed (missing critical), 1 procedural
**Impact on plan:** The hardening only narrows what reads as `stored`. The planned API and stored shape are unchanged. There is no scope creep.

## Issues Encountered
- After Task 1 and before Task 3, the full suite had 34 expected failures: the v1 pins, plus `release-package` and `phase-05-release-smoke` rejecting the not-yet-listed `zhroma-settings.js` as an unexpected asset. Task 2 cleared the release checks. The 11 pin failures left after that are the ones Task 3 restated, as the plan intended. Each task's scoped verify was green at its own commit.

## Verification
- Task 1 scoped run (11 files): 599 passed. `git diff --quiet 6d3ab0b -- extension/popup.js extension/popup.html extension/zhroma.css extension/icons extension/content.js`: exit 0
- Task 2: `INVENTORY_14`. The frozen contract, parity and settings-module files pass (140 tests). The options_ui/version check exits 0.
- Task 3: `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon` exits 0 with 112 node smoke tests and 1309 Vitest tests across 29 files. The pin-commit check confirms `83779d8` touches only `test/extension/`.
- `node scripts/verify-mutation-kills.js`: 39/39 killed.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- The worker settings queue (07-04) can call `Zhroma.settings.registry.encode/resolve/equal/cas` from the worker context. The content reader (07-05) can call `resolve` in the content world. Both loaders are already in place.
- `release/candidate.json` still describes the 0.1.0 bytes, so `verify-release` against it will report stale source. That is expected, and Phase 11 cuts a new candidate.
- For 07-08: `zhroma-settings.js` needs no config exclusion, because it is already clean under `--checkJs --strict`.

## Self-Check: PASSED
- FOUND: extension/zhroma-settings.js, extension/options.html, test/extension/settings-module.test.js
- FOUND commits: d21f08d, 9b0b274, 83779d8

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
