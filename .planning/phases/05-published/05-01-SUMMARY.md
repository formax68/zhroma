---
phase: 05-published
plan: "01"
subsystem: infra
tags: [release-packaging, zip, sha256, chrome-web-store, node-esm, vitest]

# Dependency graph
requires:
  - phase: 02-first-tint-on-a-real-view
    provides: The shipped extension source and the minimal static MV3 manifest that packaging must reproduce byte for byte
  - phase: 04-honest-failure-and-an-off-switch
    provides: The eleven-file shipped inventory and the aggregate hash convention reused by the source digest
provides:
  - Explicit eleven-file release inventory with per-file size and SHA-256 and an aggregate source digest
  - Dependency-free packaging CLI producing a manifest-at-root ZIP proven by a real extract-and-compare round trip
  - candidate.json release record keeping the ZIP hash separate from the source digest
  - Fail-closed rejection of unsafe, stale, incomplete and interrupted release packages
affects: [05-02, 05-03, 05-04, 05-05, 05-06, 05-07, store submission, release smoke evidence]

actuals:
  tokens: 11978
  tasks: 2
  commits: 4
plan_head_before: 590d52c011783a38d4a718798069fa03c9f6ba3c

tech-stack:
  added: []
  patterns:
    - "Developer-only Node ESM helpers with module-relative repository root and an import-safe CLI entry point"
    - "Finite lower-case error codes on stderr with a RELEASE_REJECTED prefix and exit 1"
    - "Central-directory preflight with Node built-ins before any extractor is allowed to write"
    - "Exclusive temporary work directory plus completion-by-rename, candidate record moved last"

key-files:
  created:
    - scripts/release-source.js
    - scripts/package-release.js
    - test/extension/release-package.test.js
  modified: []

key-decisions:
  - "Archive entries are preflighted by parsing the ZIP central directory with Node built-ins before any extractor writes to disk"
  - "Generated release artifacts are refused inside the repository or the extension tree, and an occupied output location is re-validated or refused, never overwritten"
  - "The release label comes from the extension manifest version, never the development package version"
  - "The eleven-file inventory is pinned explicitly rather than discovered, so a new shipped byte requires a reviewed edit"

patterns-established:
  - "Source identity: complete recursive enumeration, symlink and non-regular refusal, per-file size plus SHA-256, aggregate digest over `<hash>  extension/<name>` lines"
  - "Archive identity: ZIP SHA-256 recomputed from the archive's own bytes and kept separate from the source digest"
  - "Adversarial controls: hostile archives are forged from real ones by rewriting stored names in place"

requirements-completed: [STORE-01, STORE-06]

coverage:
  - id: D1
    description: "A maintainer can package the actual extension into a ZIP with manifest.json at the archive root, extract it, and prove identical names, lengths and SHA-256 hashes"
    requirement: "STORE-06"
    verification:
      - kind: integration
        ref: "test/extension/release-package.test.js#packages the real extension into a release ZIP whose extracted bytes equal every source byte"
        status: pass
      - kind: integration
        ref: "node scripts/package-release.js --out-dir /tmp/zhroma-release-tracer"
        status: pass
    human_judgment: false
  - id: D2
    description: "candidate.json records the ZIP SHA-256 separately from the source digest, and a matching source digest never approves a different archive"
    requirement: "STORE-06"
    verification:
      - kind: integration
        ref: "test/extension/release-package.test.js#records the archive hash separately from the source digest and re-derives both on validation"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#an equal source digest does not approve a different archive"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unsafe archives are refused before extraction writes anything: traversal, absolute and backslash names, symlink entries, directory entries, duplicate names and a wrong packaging root"
    requirement: "STORE-06"
    verification:
      - kind: integration
        ref: "test/extension/release-package.test.js#refuses the hostile entry name ../escape.json and writes nothing"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#refuses duplicate entry names"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#refuses an archive packaged from the wrong root or carrying directory entries"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#refuses a symlink entry inside an archive"
        status: pass
    human_judgment: false
  - id: D4
    description: "Broken and incomplete sources are refused: a changed byte at identical length, an extra nested file, a missing asset, an empty tree, a manifest-only tree, a symlinked asset and null or partial records"
    requirement: "STORE-06"
    verification:
      - kind: integration
        ref: "test/extension/release-package.test.js#rejects a changed asset byte even when every length is identical"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#rejects an extra nested file, a missing asset, an empty tree and a manifest-only tree"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#refuses null, empty and partially populated source records"
        status: pass
    human_judgment: false
  - id: D5
    description: "Stale and interrupted output is handled without overwriting evidence: an occupied location is reused only after independent re-validation, and a leftover work directory is a conflict"
    requirement: "STORE-06"
    verification:
      - kind: integration
        ref: "test/extension/release-package.test.js#reuses an output location only when its existing contents independently validate"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#treats an interrupted output as a conflict rather than a finished candidate"
        status: pass
      - kind: integration
        ref: "test/extension/release-package.test.js#treats a leftover exclusive work directory as an occupied output"
        status: pass
    human_judgment: false
  - id: D6
    description: "The packaged candidate is installable as an unpacked extension in a real Chrome profile and behaves as the repository source does"
    requirement: "STORE-01"
    verification: []
    human_judgment: true
    rationale: "Loading the extracted candidate into Chrome and observing real tinting is a live observation no automated check in this repository performs; STORE-01 also requires a public listing, which this plan does not deliver."

duration: 25 min
completed: 2026-09-11
status: complete
---

# Phase 05 Plan 01: Release Packaging Tracer Summary

**Dependency-free `scripts/package-release.js` that builds a manifest-at-root ZIP from the pinned eleven-file extension inventory, proves it by a real `zip`/`unzip` round trip with per-file SHA-256 comparison, and fails closed on unsafe, stale, incomplete or interrupted packages.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-09-11T12:20:00Z
- **Completed:** 2026-09-11T12:45:00Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments

- `scripts/release-source.js` answers "which exact bytes are we about to publish?": an explicit eleven-file inventory, a complete recursive walk that refuses symlinks and non-regular entries, per-file size and SHA-256, and an aggregate digest that reuses the Phase 4 `<hash>  extension/<name>` convention.
- `scripts/package-release.js` packages that inventory with the installed archiver using explicit relative names (so `manifest.json` lands at the archive root and no directory entry or undeclared file rides along), then proves the archive by parsing its central directory with Node built-ins, extracting into a directory that did not exist a moment earlier, and comparing every byte back against the source.
- `candidate.json` records `schema_version`, `version`, the complete `source.assets` with sizes and hashes, `source.digest`, `zip.path`, `zip.sha256` and `extracted.path` — the archive hash deliberately separate from the source digest, because two archives of identical source bytes can still differ as archives.
- The adversarial half of the suite forges hostile archives from real ones (rewriting stored names in place) and breaks real source trees one thing at a time: traversal, absolute and backslash entry names, symlink and directory entries, duplicate names, wrong packaging root, a changed byte at identical length, an extra nested file, a missing asset, an empty tree, a manifest-only tree, null and partial records, and a stale archive held against a changed manifest.
- Output handling never destroys evidence: the run works in an exclusive `mkdtemp` directory and moves results into place by rename with the candidate record moved last, an occupied output is reused only after it independently re-validates against the requested source, and a leftover work directory makes the location a conflict rather than a target.

## Task Commits

Each task was committed atomically through the RED → GREEN cycle:

1. **Task 1 (tracer): Round-trip the real extension through a release ZIP**
   - RED — `f6a17db` (`test(05-01)`): failing real round-trip contract; `check tdd-red-evidence` returned `RED_EVIDENCE_OK` / `target_test_failed`
   - GREEN — `0e52805` (`feat(05-01)`): inventory, packaging, preflight, extraction and comparison
2. **Task 2: Reject unsafe, stale and interrupted release packages**
   - RED — `59ee8bd` (`test(05-01)`): adversarial controls, 3 of 24 failing; `RED_EVIDENCE_OK` / `target_test_failed`
   - GREEN — `d5de874` (`feat(05-01)`): archive byte ceiling, leftover-work-directory conflict, directory-entry classification

No REFACTOR commit: neither GREEN left an obvious cleanup, and the reference commits that phase only on change.

## Files Created/Modified

- `scripts/release-source.js` — `RELEASE_FILES`, `readReleaseSource`, `compareReleaseSources`, `digestOf`, `requireReleaseSourceShape`; complete-inventory source identity for the shipped tree
- `scripts/package-release.js` — `packageRelease`, `validateReleaseArchive`, `validateReleaseCandidate`, `readArchiveEntries`, `assertSafeEntryName`, `assertArchiveMatchesSource`, `archiveByteCeiling`, `readManifestVersion`, `releaseNames`, `requireUniqueJsonMembers`, and the `--out-dir` / `--source-dir` CLI
- `test/extension/release-package.test.js` — 24 tests: the real round trip plus every adversarial control

## Decisions Made

- **Parse the central directory ourselves rather than read the extractor's listing.** A preflight that parses text printed by `unzip` is trusting the very tool it exists to check. Reading the archive's own central directory with Node built-ins gives names, types and declared sizes before anything is allowed to write to disk.
- **Refuse generated artifacts inside the repository or the extension tree.** D-13 requires packaged bytes to equal repository source; the surest way to keep a generated ZIP out of Git source is to make the packager refuse to put one there. `--out-dir` is mandatory and is checked through `realpath` so a symlink cannot evade containment.
- **Never overwrite an existing output.** An occupied location is either re-proved against the requested source and reused, or the run fails `output-conflict` with the existing files untouched — D-14's prohibition on silently reusing stale source-bound acceptance, made operational.
- **Label from the extension manifest version (`0.1.0`), not the development package version (`0.0.0`).** The store treats the manifest version as the release identity; the root `package.json` version is unrelated dev metadata, and the test asserts the two are different so the coupling cannot be reintroduced silently.
- **Pin the inventory explicitly.** A discovered inventory cannot tell "a new asset was shipped" from "a stray file leaked into the package". `RELEASE_FILES` must be edited in a reviewed commit before a new byte can reach the store.

## Deviations from Plan

**Two deviations, both auto-fixed under Rule 3 (blocking), both within Task 2's own test construction and implementation.**

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The archiver refuses to store one name twice, so the duplicate-entry control could not be built as planned**
- **Found during:** Task 2 (RED phase)
- **Issue:** `zip -j` exits 16 with "cannot repeat names in zip file", so no invocation of the installed archiver can produce the duplicate-name archive the plan's `<behavior>` requires as a control.
- **Fix:** Forged the duplicate the way a hostile uploader would — zip two equal-length placeholder names, then rewrite the second stored name to the first in both the local header and the central directory (`rewriteStoredName`, extracted from the existing `craftedArchive` helper so both hostile-archive constructions share it).
- **Files modified:** `test/extension/release-package.test.js`
- **Verification:** `readArchiveEntries` now observes `['first.json', 'first.json']` and validation rejects with `archive-duplicate-entry`.
- **Committed in:** `59ee8bd` (Task 2 RED commit)

**2. [Rule 3 - Blocking] A directory entry was misreported as a traversal attempt**
- **Found during:** Task 2 (RED phase)
- **Issue:** A ZIP directory entry is stored as `icons/`, whose trailing slash produced an empty path segment, so `assertSafeEntryName` rejected it as `archive-traversal-entry` before the entry-kind check could report the real problem. The refusal was correct; the diagnosis was not, and the plan's control asserts the type of the refusal.
- **Fix:** `assertSafeEntryName` now tolerates one trailing slash — the format's directory marker — and validates the remaining path, leaving `entryKind` to refuse the entry as `archive-nonregular-entry`.
- **Files modified:** `scripts/package-release.js`
- **Verification:** the directory-entry control now rejects with `archive-nonregular-entry`; the three hostile-name controls still reject with their own codes.
- **Committed in:** `d5de874` (Task 2 GREEN commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** None on scope. Both were discovered by the plan's own named controls and resolved inside the files the plan already owns. No scope creep, no new dependency, no change to `package.json`.

## TDD Gate Compliance

| Task | RED | GREEN | REFACTOR | Status |
|------|-----|-------|----------|--------|
| 1 (tracer) | `f6a17db` | `0e52805` | — | Pass |
| 2 | `59ee8bd` | `d5de874` | — | Pass |

Both RED phases were verified with `gsd-tools check tdd-red-evidence` and returned `RED_EVIDENCE_OK` (`target_test_failed`) — the named target test failed on an assertion for the planned behaviour, not on a load or fixture crash. Task 1's RED commit carries API skeletons alongside the failing test precisely so the failure would be an assertion rather than a module-resolution error.

## Issues Encountered

None beyond the two deviations above. The full suite is green: 1018 Vitest tests across 23 files plus 65 node smoke tests, with no pre-existing test modified.

## Tracer Feedback Gate

Task 1 is `type="tracer"` with the default `gate="blocking"`. Auto mode is off (`_auto_chain_active` and `auto_advance` both `false`), `human_verify_mode` is `end-of-phase`, and the tracer's `<verify>` carries only `<automated>` checks — so per the execute-plan tracer branch the verify was re-run end to end rather than surfaced as a checkpoint. Both commands passed (`RELEASE_PACKAGE_OK 0.1.0 52d053b5…`, 8/8 tests at that point), and expansion proceeded.

## Constraint Compliance

- **D-13:** no new permission, dependency, bundler, remote code, telemetry or network call. `package.json`, `package-lock.json` and `node_modules` are untouched; both scripts use Node built-ins plus the already-installed system `zip`/`unzip`. Nothing under `extension/` changed, so packaged bytes still equal repository source.
- **D-14:** release checks are bound to the exact packaged source. The candidate carries the complete per-file inventory and both hashes; validation recomputes the archive hash and the extracted bytes and never trusts the record's own claims.
- **Threat register:** T-05-01 (explicit inventory, `lstat`, entry preflight, isolated extraction, byte comparison), T-05-02 (only declared assets packaged; diagnostics are codes, asserted free of file content), T-05-03 (separate archive hash, source digest and per-file metadata; completion by rename), T-05-04 (entry names, types and sizes checked against the known inventory before extraction, plus an inventory-derived archive byte ceiling checked before the file is read into memory).

## Known Stubs

None. No placeholder values, no skipped tests, no unrun `<verify>` command.

## Threat Flags

None. The plan introduces no network endpoint, auth path or schema at a trust boundary; the new file access is developer tooling confined to a caller-named output directory outside the repository.

## User Setup Required

None — no external service configuration is required by this plan. Chrome Web Store account setup remains a later plan in this phase.

## Next Phase Readiness

- A maintainer can now produce an exact-source release candidate on demand and prove it, which is the precondition the remaining Phase 5 plans (listing copy, icons and screenshots, privacy policy, smoke record, submission review) all bind their evidence to.
- **Any change to a shipped byte — manifest metadata, brand icon sizes, anything under `extension/` — changes `source.digest` and the ZIP hash, and invalidates every candidate built before it.** `RELEASE_FILES` must be edited in the same reviewed commit as a new asset, and `test/extension/runtime-contract.test.js` pins the same inventory independently.
- STORE-01 and STORE-06 remain `Pending` in REQUIREMENTS.md. Six sibling plans in this phase also declare them, so `requirements ready-ids` correctly reported `0/2 ready` — this plan delivers local packaging, not a public listing or a recorded live smoke run.
- Predecessor limits are unchanged: Phase 3 stays `human_needed`, Phase 4 stays `human_needed`. Nothing here converts an automated packaging pass into a live acceptance result.

## Self-Check: PASSED

- `scripts/release-source.js`, `scripts/package-release.js`, `test/extension/release-package.test.js` — all present on disk
- `f6a17db`, `0e52805`, `59ee8bd`, `d5de874` — all present in `git log`
- `git rev-list --count 590d52c..HEAD` = 4, matching `actuals.commits`
- Plan `<verification>`: `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/release-package.test.js` → 24/24 pass; `node scripts/package-release.js --out-dir /tmp/zhroma-release-tracer` → exit 0, `RELEASE_PACKAGE_OK`
- Full regression: `npm test` → 65 node smoke tests and 1018 Vitest tests, all passing

---
*Phase: 05-published*
*Completed: 2026-09-11*
