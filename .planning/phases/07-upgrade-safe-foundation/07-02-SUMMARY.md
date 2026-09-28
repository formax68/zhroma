---
phase: 07-upgrade-safe-foundation
plan: 02
subsystem: tooling
tags: [typescript, types-chrome, devDependencies, dependency-approvals, supply-chain]

requires:
  - phase: 01-dom-recon-spike
    provides: DEPENDENCY-APPROVALS.md record format and test/recon/dependency-approvals.smoke.js
provides:
  - typescript 7.0.2 and @types/chrome 0.3.0 as exact-pinned devDependencies, resolved in package-lock.json
  - two attested approval rows plus verbatim answers to three separate Phase 7 questions in DEPENDENCY-APPROVALS.md
  - an approved but unused typescript 6.0.3 fallback
affects: [07-08 tsc --noEmit --checkJs wiring, 08-themes dependency approvals]

actuals:
  tokens: 4471
  tasks: 2
  commits: 1
plan_head_before: 688f5cf6a138c19388e21a1265cf3ff73d018773
plan_head_after: 2da0edfd429eb309e38eb67e359817a46961a9d6

tech-stack:
  added: [typescript@7.0.2, "@types/chrome@0.3.0"]
  patterns:
    - "Dependency gate: one question per exact version, registry re-read in the same session, verbatim answer recorded before install"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - DEPENDENCY-APPROVALS.md

key-decisions:
  - "typescript 7.0.2 installed (not the 6.0.3 fallback) because tsc 7.0.2 runs on this machine; 6.0.3 stays approved but unused"
  - "Approval answers recorded verbatim as the user gave them: 'Yes, approve 7.0.2', 'Yes, approve 0.3.0', 'Yes, approve 6.0.3 fallback'"

patterns-established:
  - "New dev dependencies are added only as rows in the existing attestation table, never in a new markdown table, because the smoke test counts every '| ' row"

requirements-completed: [COMPAT-04]

coverage:
  - id: D1
    description: "typescript and @types/chrome installed as exact devDependencies, matching package-lock.json and the approval rows"
    requirement: "COMPAT-04"
    verification:
      - kind: unit
        ref: "test/recon/dependency-approvals.smoke.js (node --test, 7/7 pass)"
        status: pass
      - kind: other
        ref: "node node_modules/typescript/bin/tsc --version -> Version 7.0.2"
        status: pass
      - kind: other
        ref: "plan verify node -e devDependencies check -> DEV_DEPENDENCIES_EXACT; git status --porcelain -- extension empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each package approved in its own question before install, with the verbatim answers recorded"
    requirement: "COMPAT-04"
    verification:
      - kind: manual_procedural
        ref: "Task 1 blocking-human checkpoint answers relayed by the orchestrator, 2026-09-28"
        status: pass
    human_judgment: true
    rationale: "Whether the questions were really asked separately and answered by the user is a fact about the conversation; no test can check it"

duration: 2min (continuation; excludes checkpoint wait)
completed: 2026-09-28
status: complete
---

# Phase 7 Plan 02: Dev type-checking dependencies Summary

**typescript 7.0.2 and @types/chrome 0.3.0 installed as exact-pinned devDependencies after three separate verbatim-recorded approvals; the 6.0.3 fallback is approved but unused because tsc 7.0.2 runs**

## Performance

- **Duration:** 2 min for this continuation (Task 1 waited on the user through the orchestrator)
- **Started:** 2026-09-28T08:19:03Z
- **Completed:** 2026-09-28T08:20:52Z
- **Tasks:** 2 (Task 1 was answered by the user through the orchestrator; Task 2 was run here)
- **Files modified:** 3

## Accomplishments

- Re-read the npm registry just before installing. `typescript` latest was still `7.0.2` and `@types/chrome` latest was still `0.3.0`, the versions the user approved.
- Installed with `--save-dev --save-exact`. package.json gained exactly two devDependencies. `happy-dom` 20.13.1 and `vitest` 4.1.11 are unchanged, and there is still no `dependencies` key.
- The lockfile added `typescript`, its 20 optional `@typescript/typescript-<platform>` binaries, `@types/chrome`, `@types/filesystem`, `@types/filewriter` and `@types/har-format`. All are dev-only.
- Added two `attested` rows to DEPENDENCY-APPROVALS.md, plus questions 3, 4 and 5 with the user's verbatim answers as `>` quotes, and a sentence saying the Phase 7 questions were asked separately, one package per question, on 2026-09-28. The `## Independence — answered separately` section and everything after it is byte-identical (checked with `cmp`).

## Task Commits

1. **Task 1: Separate exact-version approvals** — no commit (checkpoint only; package.json, package-lock.json and node_modules were clean when it was raised)
2. **Task 2: Install the approved exact versions and record the approvals** — `2da0edf` (chore)

## Files Created/Modified

- `package.json` — adds `"@types/chrome": "0.3.0"` and `"typescript": "7.0.2"` to devDependencies
- `package-lock.json` — resolved entries for both packages and their dev-only transitive packages
- `DEPENDENCY-APPROVALS.md` — two attestation rows, questions 3–5 with verbatim answers, and the note that each question was asked separately

## Decisions Made

- Kept typescript 7.0.2. `node node_modules/typescript/bin/tsc --version` printed `Version 7.0.2`, so the approved 6.0.3 fallback was not needed. This plan only checks that tsc runs. Whether 7.0.2 can actually type-check the project's JavaScript is tested in Plan 07-08. The fallback approval is on record in case it can't.

## Deviations from Plan

None in the plan's scope.

One process note: the executor's protected-branch check reports `main` as protected. Task 2 was committed on `main` anyway, because the orchestrator dispatched this as a sequential executor on the main working tree, `git.branching_strategy` is `none`, and Plan 07-01 committed on `main` earlier in this phase. Nothing was forced or rewritten.

## Issues Encountered

- npm printed a warning that `fsevents@2.3.3` has install scripts not covered by allowScripts. fsevents was already there as a transitive dependency of the existing vitest toolchain. This plan did not add it and did nothing about the warning.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 07-08 can add `tsc --noEmit --checkJs` to `npm test` using `node_modules/typescript/bin/tsc`. The full suite passes now: 28 files, 1239 tests.
- If tsc 7.0.2 can't check the JavaScript there, reinstall `typescript@6.0.3` with `--save-exact`, change the typescript row's version and note to match, and re-run the approvals smoke test.

## Self-Check: PASSED

- FOUND: package.json, package-lock.json, DEPENDENCY-APPROVALS.md (all modified, committed in 2da0edf)
- FOUND: commit 2da0edf on main
- PASS: `node --test test/recon/dependency-approvals.smoke.js` 7/7; tsc prints `Version 7.0.2`; `DEV_DEPENDENCIES_EXACT`; no extension/ change; `> I don't remember, it should be fine` present

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-09-28*
