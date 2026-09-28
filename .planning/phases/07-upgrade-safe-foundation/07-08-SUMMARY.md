---
phase: 07-upgrade-safe-foundation
plan: 08
subsystem: testing
tags: [typescript, tsc, checkJs, jsdoc, type-check, chrome-extension]

requires:
  - phase: 07-upgrade-safe-foundation (07-02)
    provides: typescript 7.0.2 and @types/chrome 0.3.0 installed exact-pinned after separate approvals
  - phase: 07-upgrade-safe-foundation (07-03 to 07-07)
    provides: the final Phase 7 shared settings module and worker/content changes being checked
provides:
  - Strict, blocking, dev-only `tsc --noEmit --checkJs` of extension/zhroma-settings.js, first step of test:recon
  - Non-strict check of extension/background.js as shipped (tsconfig.v1.json)
  - Written exclusion record for content.js and popup.js with diagnostic counts and codes
  - types/zhroma.d.ts typing the Zhroma global from the module's own JSDoc typedefs, plus importScripts
affects: [08-themes-dark-mode, 09-colouring-rules, 10-rule-editor, 11-release]

actuals:
  tokens: 3816
  tasks: 2
  commits: 2
plan_head_before: ac2b001cf3422305afbeea301e34d7db65ecc141
plan_head_after: 583cd023df9ebacf517af39bf8d29a247074756b

tech-stack:
  added: []
  patterns:
    - "Type check runs as the first step of test:recon, so npm test and the release automated check both block on it"
    - "Public JSDoc typedefs of a shared classic script live at top level, outside the IIFE, so they are global to the checker only"
    - "typeRoots pinned relative to the root tsconfig so any config extending it resolves @types/chrome"

key-files:
  created:
    - tsconfig.json
    - tsconfig.v1.json
    - types/zhroma.d.ts
  modified:
    - package.json
    - extension/zhroma-settings.js

key-decisions:
  - "07-08: tsc runs first inside test:recon (not only in test), because release/candidate.json's automated check runs test:recon directly; typecheck script mirrors both steps"
  - "07-08: background.js joins the check unmodified via tsconfig.v1.json (strict false, 0 diagnostics); content.js (TS2339 x1) and popup.js (TS2339 x8) stay out with the reason in tsconfig.json; none of the diagnostics is a genuine bug"
  - "07-08: the public settings typedefs moved to top level of zhroma-settings.js and a ZhromaSettingsApi typedef is checked against the frozen Zhroma.settings value, so types/zhroma.d.ts types the global from them"
  - "07-08: skipLibCheck stays true as planned, which also skips types/zhroma.d.ts; the file is kept to names the module defines and its resolution was measured with a skipLibCheck-false probe"

patterns-established:
  - "Non-vacuity of a check is proven by a scratch project in $TMPDIR extending the repo config by absolute path, with a seeded error"

requirements-completed: [COMPAT-04]

coverage:
  - id: D1
    description: "A strict type check of extension/zhroma-settings.js runs first in test:recon and fails npm test and the release automated check on a type error"
    requirement: COMPAT-04
    verification:
      - kind: other
        ref: "node node_modules/typescript/bin/tsc -p tsconfig.json (exit 0, no diagnostics)"
        status: pass
      - kind: other
        ref: "node node_modules/typescript/bin/tsc -p $TMPDIR/tscheck-negative/tsconfig.json (exit 1, TS2322 on the seeded bad.js)"
        status: pass
      - kind: other
        ref: "package.json scripts assertion: TYPECHECK_IN_TEST_RECON"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon (112 smoke + 1439 Vitest pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each accepted v1 script is either checked as shipped (background.js) or excluded with a written reason (content.js, popup.js), with no v1 byte changed"
    requirement: COMPAT-04
    verification:
      - kind: other
        ref: "node node_modules/typescript/bin/tsc -p tsconfig.v1.json (exit 0); seeded bad.js under tsconfig.v1.json exits 1 with TS2322"
        status: pass
      - kind: other
        ref: "TYPECHECK_SCRIPTS_CONSISTENT assertion; git diff --quiet 6d3ab0b -- extension/popup.js; shasum -c of the three v1 files recorded before Task 2"
        status: pass
    human_judgment: false
  - id: D3
    description: "The check emits nothing and changes nothing that ships"
    requirement: COMPAT-04
    verification:
      - kind: other
        ref: "git status --porcelain after the check shows no emitted file; git ls-files extension lists no tsconfig or .d.ts"
        status: pass
      - kind: integration
        ref: "release-package, runtime-contract and frozen-contract suites inside the full test:recon run; npm run test:mutants 52/52 killed"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 08: Blocking Dev-Only Type Check Summary

**`tsc 7.0.2 --noEmit --checkJs` strictly checks the shared settings module as the first step of test:recon, checks background.js unmodified under a non-strict config, and records why content.js and popup.js stay out.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-28T09:35:27Z
- **Completed:** 2026-09-28T09:42:30Z
- **Tasks:** 2
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments

- tsconfig.json at the repository root sets `allowJs`, `checkJs`, `noEmit`, `strict`, `target` ES2022, `lib` ES2022 + DOM, `types` chrome and `skipLibCheck`, and includes only extension/zhroma-settings.js and types/zhroma.d.ts. It exits 0 on the final Phase 7 source with no fixes needed.
- package.json: `typecheck` script added. `test:recon` now starts with `node node_modules/typescript/bin/tsc -p tsconfig.json && node node_modules/typescript/bin/tsc -p tsconfig.v1.json && `, so `npm test` and `release/candidate.json`'s `npm --prefix . run test:recon` both fail on a type error. `test` is still `npm run test:recon`, and devDependencies are unchanged.
- Non-vacuity was measured in three ways:
  - A seeded `@type {number}` assignment in a scratch project extending the root config fails with TS2322.
  - The same seeded error under tsconfig.v1.json also fails with TS2322.
  - A copy of the settings module with an unannotated parameter fails strict mode with TS7006.
- The D-21 measurement, per file, with strict false and no edits:
  - background.js: 0 diagnostics, so it is checked as shipped by tsconfig.v1.json.
  - content.js: 1 × TS2339, so it is excluded.
  - popup.js: 8 × TS2339, so it is excluded.
  - The excluded files and their reasons are written in tsconfig.json.
- The three v1 files are byte-identical before and after (sha256 checked). popup.js is still identical to 6d3ab0b.
- Nothing is emitted. There is no config or declaration file under extension/, and RELEASE_FILES and the inventory pins are unchanged.

## Task Commits

1. **Task 1: A blocking strict type check of the shared settings module inside test:recon** - `0dd16a1` (feat)
2. **Task 2: Decide, file by file, whether the accepted v1 scripts join the check unmodified** - `583cd02` (feat)

## Files Created/Modified

- `tsconfig.json`: the strict dev-only check. It also carries the v1 inclusion and exclusion record as `//` comments.
- `tsconfig.v1.json`: the non-strict check of extension/background.js as shipped.
- `types/zhroma.d.ts`: `declare var Zhroma: { readonly settings?: ZhromaSettingsApi } | undefined` and `declare function importScripts(...urls: string[]): void`.
- `package.json`: the `typecheck` script, and the two tsc steps at the start of `test:recon`.
- `extension/zhroma-settings.js`: JSDoc only, plus one binding.
  - The public typedefs (SettingStatus, SettingEntry, Resolved, Registry, Outcome, SettingRequest, SettingReply, ReadResult, QueueOptions, SettingsQueue) moved to top level.
  - A new `ZhromaSettingsApi` typedef was added.
  - The frozen settings object is now bound to `/** @type {ZhromaSettingsApi} */ const api` before `defineProperty`.
  - Behaviour is unchanged: all 13 settings-foundation mutant literals still occur exactly once, and the mutation gate killed 52/52.

## Decisions Made

- **Where the type check runs:** it goes inside `test:recon`, not only `test`, which closes the choice left open in 07-PATTERNS.md. The release candidate's automated check runs `test:recon` directly.
- **Which v1 files join:** background.js joins. content.js and popup.js are excluded, because every diagnostic in them is a type the checker cannot narrow, not a runtime fault:
  - content.js: an attributes MutationRecord's target is always an Element.
  - popup.js: getElementById returns HTMLElement for what is really the checkbox input.
  - D-21's genuine-bug branch did not apply, so no `fix(07-08):` commit and no checkpoint were needed.
- **`skipLibCheck` stays true, as planned.** @types/chrome is clean under TS 7 even with it off (measured), but the plan named true. The cost is that types/zhroma.d.ts itself is not checked, so the file says so and is kept to names the module defines.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `typeRoots` pinned in tsconfig.json**
- **Found during:** Task 1 (non-vacuity step)
- **Issue:** A scratch config in `$TMPDIR` that extends the root tsconfig failed with `TS2688: Cannot find type definition file for 'chrome'`, because default type roots resolve from the extending config's directory. The seeded negative project would then have exited non-zero for the wrong reason, which is exactly the vacuous proof T-07-24 guards against.
- **Fix:** Added `"typeRoots": ["./node_modules/@types"]`, which resolves relative to tsconfig.json itself. The negative projects now fail only on the seeded TS2322.
- **Files modified:** tsconfig.json
- **Verification:** The negative project's only diagnostic is `bad.js(4,1): error TS2322`.
- **Committed in:** 0dd16a1

**2. [Rule 3 - Blocking] Settings typedefs moved to top level so the d.ts can use them**
- **Found during:** Task 1 (step 2)
- **Issue:** The typedefs sat inside the module's IIFE, which makes them local to it. A probe that referenced `SettingsQueue` from outside got TS2304. A d.ts that referenced `Registry` silently became `any`, because skipLibCheck skips .d.ts files. The plan's "settings member typed from the JSDoc typedefs" could not be met in place.
- **Fix:**
  - Moved the ten public typedefs above the IIFE. A top-level typedef in a classic script is global to the checker, and it adds nothing at run time.
  - Added a `ZhromaSettingsApi` typedef, checked against the real frozen value.
  - The worker-internal `Job` typedef stays inside `createQueue`.
- **Files modified:** extension/zhroma-settings.js, types/zhroma.d.ts
- **Verification:**
  - A skipLibCheck-false probe using the global reports real types, for example `Type 'readonly string[]' is not assignable to type 'number'` for `Zhroma.settings.registry.keys`.
  - The settings-module, settings-queue, settings-reader, mutation-registry and runtime-contract suites pass (170 tests). The module-purity pin still holds: no `chrome`, `document`, `window` or `http` in the source.
- **Committed in:** 0dd16a1

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were needed for the plan's own truths: a non-vacuous negative proof, and a global typed from the module's typedefs. No scope creep, no v1 byte and no dependency change.

## Issues Encountered

None.

## Known Limits

- types/zhroma.d.ts is covered by `skipLibCheck`, so a misspelt name in it would become `any` rather than fail. To re-verify it, run a scratch project extending tsconfig.json with `"skipLibCheck": false` that includes the module, the d.ts and a `.ts` file misusing `Zhroma.settings`. The misuse must be reported.

## User Setup Required

None: no external service configuration required.

## Next Phase Readiness

- The shared module's JSDoc contract is now enforced. Phase 8 extends `Zhroma.settings`, so it should add its typedefs at top level and extend `ZhromaSettingsApi`.
- When a later phase rewrites content.js or popup.js, it can add those files to tsconfig.v1.json (or the strict config) and delete their exclusion entries in tsconfig.json.
- Phase 7 plan 09 remains.

## Self-Check: PASSED

- FOUND: tsconfig.json, tsconfig.v1.json, types/zhroma.d.ts
- FOUND: 0dd16a1, 583cd02
- `tsc -p tsconfig.json` and `tsc -p tsconfig.v1.json` exit 0; both seeded negative projects exit 1 with TS2322
- Full `test:recon` run: 112 smoke + 1439 Vitest passed; `test:mutants` 52/52 killed
- The three v1 sha256 values are unchanged; no file is emitted

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
