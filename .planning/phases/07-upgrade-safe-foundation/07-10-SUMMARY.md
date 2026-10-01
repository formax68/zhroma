---
phase: 07-upgrade-safe-foundation
plan: 10
subsystem: testing
tags: [frozen-contract, vitest, regex, mv3, privacy, wr-06]

requires:
  - phase: 07-upgrade-safe-foundation
    provides: "07-01 frozen contract (8e9373b) with discover() walker, NETWORK_CALL, REMOTE_CODE, REMOTE_REFERENCE, SYNC_AREA, STYLE_LOAD and styleBlocks"
provides:
  - "codeOf: string-aware, single-pass comment stripper for shipped scripts"
  - "NETWORK_NAME and SYNC_NAME identifier-level rules over codeOf(script)"
  - "SCHEME_RELATIVE rule over raw scripts, pages and stylesheets"
  - "STYLE_IMAGE_SET and styleAttributes page style-attribute load checks"
  - "documented limits of the new rules inside the frozen file"
affects: [07-12, phase-08, phase-09, phase-10, phase-11]

actuals:
  tokens: 2220
  tasks: 1
  commits: 1
plan_head_before: 59987e79db9286777d08dbafebc2f639b380cf6e
plan_head_after: b0ae2dc90c8b441a0cb9a32696399d09c24cae42

tech-stack:
  added: []
  patterns:
    - "Names, not calls: identifier bans run on comment-stripped script text; call-shaped rules keep running on raw text"
    - "Strings before comment openers in one ordered-alternation regex, so '/*' and '//' inside a string never start a comment"
    - "Banned-name string literals survive stripping; every other quoted string is blanked; template literals are kept whole (fail closed)"

key-files:
  created: []
  modified:
    - test/extension/frozen-contract.test.js

key-decisions:
  - "07-10: the frozen contract was tightened once, additively (166 added, 0 deleted) in b0ae2dc; existing patterns and tests unchanged; extension/ and runtime-contract.test.js untouched"
  - "07-10: identifier rules (NETWORK_NAME, SYNC_NAME) run on codeOf(script) for scripts only; SCHEME_RELATIVE runs on RAW scripts, pages and stylesheets because the stripper blanks string contents"
  - "07-10: one shared clean-control list (existing prose control, both shipped comments verbatim, 'Settings never sync to other devices', 'We do not fetch anything', a block comment naming the APIs, syncController, async) guards both identifier rules"

patterns-established:
  - "A frozen-file tightening is one test-only, additive commit with a Why: body, proven by a commit-shape check"

requirements-completed: [DATA-01]

coverage:
  - id: D1
    description: "String-aware comment stripper codeOf with exact-output controls and a non-vacuity check on the shipped scripts"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js#the comment stripper is string-aware and removes the shipped comments (07-10)"
        status: pass
    human_judgment: false
  - id: D2
    description: "NETWORK_NAME catches all 22 WR-06 network evasion forms, passes the clean controls, and passes every shipped script"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js#no shipped script names a network API outside its comments (D-27, WR-06)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SYNC_NAME catches all 8 aliased or destructured chrome.storage sync forms, passes the clean controls, and passes every shipped script"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js#no shipped script names the sync storage area outside its comments (DATA-01, WR-06)"
        status: pass
    human_judgment: false
  - id: D4
    description: "SCHEME_RELATIVE catches all 10 scheme-relative forms, passes the 5 clean controls, and passes the raw text of every shipped script, page and stylesheet"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js#no shipped script, page or stylesheet holds a scheme-relative URL (D-27, WR-06)"
        status: pass
    human_judgment: false
  - id: D5
    description: "STYLE_IMAGE_SET and styleAttributes: image-set( banned in stylesheets, style blocks and style attributes; style attributes also checked against STYLE_LOAD"
    requirement: DATA-01
    verification:
      - kind: unit
        ref: "test/extension/frozen-contract.test.js#stylesheets, page style blocks and page style attributes load nothing (D-26, WR-06)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The tightening is one additive, test-only commit after 8e9373b with a Why: body; extension/ and runtime-contract.test.js unchanged"
    verification:
      - kind: other
        ref: "plan 07-10 commit-shape check (prints FROZEN_TIGHTENING_SHAPE_OK)"
        status: pass
      - kind: integration
        ref: "env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm --prefix . run test:recon"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-10-01
status: complete
---

# Phase 7 Plan 10: Frozen Contract Tightening (WR-06) Summary

**The frozen contract now bans network API names and the `sync` name over comment-stripped scripts, and bans scheme-relative `//host` URLs over raw scripts, pages and stylesheets. A string-aware single-pass stripper (`codeOf`) does the comment removal, and every WR-06 evasion form has a negative control. The change is one additive, test-only commit, b0ae2dc.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-10-01T17:42:38Z
- **Completed:** 2026-10-01T17:45:06Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments

- `codeOf(source)`: one global regex with ordered alternation (single-quoted string, double-quoted string, template literal, block comment, line comment). A quoted string whose whole text is a banned name is kept. Any other quoted string is blanked to its two quotes. Template literals are kept whole. Block comments become whitespace with their newlines kept, and line comments are removed. Exact-output controls cover `'/*'; fetch(u); '*/'`, `'//'; fetch(u)`, escaped quotes and templates that contain comment openers. A non-vacuity check shows that stripping changes and shortens at least one shipped script.
- `NETWORK_NAME` (fetch, fetchLater, XMLHttpRequest, WebSocket, WebSocketStream, EventSource, sendBeacon, WebTransport, RTCPeerConnection) catches all 22 network forms in the behavior block.
- `SYNC_NAME` (`\bsync\b`) catches all 8 sync forms.
- `SCHEME_RELATIVE` (``/[`'"(=,]\s*\/\/[^\s/]/u``) catches all 10 scheme-relative forms.
- `STYLE_IMAGE_SET` and `styleAttributes` close the image-set and style-attribute gaps the debug session found.
- Every shipped script, page and stylesheet passes every new rule. Without the stripper, the raw text of content.js trips `NETWORK_NAME` and the raw text of background.js trips `SYNC_NAME`, in both cases inside comments. This confirms the stripper is required.
- Test count for frozen-contract.test.js went from 7 before to 12 after (5 new tests). The full suite passes: 112 node smoke tests and 1446 Vitest tests, with no `error TS`.

## Task Commits

1. **Task 1: Tighten the frozen contract end to end (WR-06)**: `b0ae2dc` (test). 07-12 cites this sha.

**Plan metadata:** recorded in the docs(07-10) commit that adds this SUMMARY.

## Files Created/Modified

- `test/extension/frozen-contract.test.js`: 166 lines added and 0 deleted. Adds a header paragraph on the 07-10 tightening, the names-not-calls section with its limits comment, `NETWORK_NAMES`/`BANNED_NAMES`, `NETWORK_NAME`, `SYNC_NAME`, `SCHEME_RELATIVE`, `LEXEME`, `codeOf`, `SHIPPED_PROSE`/`CLEAN_CODE`, `STYLE_IMAGE_SET`, `styleAttributes` and five new tests.

## Documented Limits (recorded in the file)

The new rules cannot reach:
- computed or concatenated names, such as `'fe' + 'tch'`
- escape sequences in identifiers or strings
- URLs assembled at run time from page data
- regex literals containing a quote, `/*` or `//`, which the lexer-free stripper can mis-pair

By design:
- prose inside template literals is scanned whole, so it must avoid the banned words
- comparing a storage area name with the string `'sync'` trips the sync rule (compare with `'local'` instead)
- a string that begins with two slashes trips the scheme-relative rule

## Decisions Made

- `styleAttributes` matches a `style` attribute only when it follows whitespace, a quote or a slash. This stops `data-style="..."` from matching, and it still catches an attribute written straight after a quoted value, which fails closed. Unquoted values run to the next whitespace or `>`.
- One shared `CLEAN_CODE` list is used for both identifier rules, because no clean control contains either banned word outside a comment or a blanked string.
- An extra negative control proves that a page style attribute carrying `url(//...)` is caught by the reused `STYLE_LOAD` constant. The constant itself is unchanged.

## Deviations from Plan

**1. [Orchestrator directive] Committed on branch `main`**
- **Found during:** the Task 1 commit
- **Issue:** The executor's generic pre-commit HEAD assertion treats `main` as protected (`git.base-branch --is-protected main` returns true, and `git.allow_default_branch_commits` is not set).
- **Resolution:** The orchestrator explicitly dispatched this plan as a sequential executor on the main working tree, branch `main`, with normal commits. The project's `git.branching_strategy` is `none`, and every earlier Phase 7 plan committed on `main`. The plan's own commit-shape check also requires the commit to be in `8e9373b..HEAD`. The project-root pin guard passed before the commit. No ref was rewritten.

Otherwise the plan was executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- G-07-4b / WR-06 is closed. The frozen file's history is now 8e9373b plus exactly one additive commit, b0ae2dc.
- 07-11 (WR-01) is next. 07-12 cites b0ae2dc. STATE.md and 07-VERIFICATION.md still say the frozen file has "not been touched since 8e9373b", and those records need refreshing (owned by the later plan or reverification).

## Self-Check: PASSED

- FOUND: test/extension/frozen-contract.test.js
- FOUND: commit b0ae2dc
- Shape check printed FROZEN_TIGHTENING_SHAPE_OK. The focused suites ran 37 tests (12 frozen plus 25 runtime) and all passed. The full suite (test:recon) exited 0.

---
*Phase: 07-upgrade-safe-foundation*
*Completed: 2026-10-01*
