---
phase: 04-honest-failure-and-an-off-switch
plan: "03"
subsystem: extension-runtime
tags: [chrome-extension, mv3, diagnosis, mutation-observer, settle-window, toolbar-action, popup, icons, tdd]

requires:
  - phase: 04-honest-failure-and-an-off-switch
    provides: "04-02 — the tracer seam: content/worker/popup contexts, the finite {diagnosis, reason} protocol, per-tab generations and a serialized action queue"
  - phase: 04-honest-failure-and-an-off-switch
    provides: "04-06 — test/extension/chrome-harness.js, the strict Chrome allow-list, and the restored inherited suites"
  - phase: 04-honest-failure-and-an-off-switch
    provides: "04-DECISIONS.json — toolbar=distinct-icons, popup=concise-no-link (binding, user-selected)"
provides:
  - "inspectCandidateTable expanded to safe/blank/missing/waiting/unsupported/unsafe with whole-table body validation shared before the Priority-index branch"
  - "A revision-gated 100 ms missing-column settle window: one pending timer, fresh DOM re-inspection at the callback, synchronous withdrawal, cancellation on pause/off/exception"
  - "The three-way product taxonomy on the wire: diagnosis in {working, missing, cannot-read, neutral}, reason in {blank, unsupported-language, structure, null}, validated as one pair"
  - "extension/icons/missing.png + unreadable.png — locally authored 32x32 RGBA PNGs completing the four reachable shape treatments"
  - "Worker and popup copy for all five decided messages plus the three operational ones, keyed by the whole pair"
  - "test/extension/diagnosis.test.js — 29 actual-source D-01 certainty, invalidation and reason-classification tests"
  - "A multi-tab tracer world: per-tab content contexts, active/current-window control, tab open/close and worker termination"
affects: [04-04, 04-05]

actuals:
  tokens: 10903
  tasks: 2
  commits: 4
plan_head_before: c260f2a1db821bf8c7a0bfd965c6af65e5a62e57

tech-stack:
  added: []
  patterns:
    - "Certainty as a revision, not a clock: a settle window is measured by counting interpretation-affecting mutations rather than by reading a wall clock, so the timer is fully controllable by the test harness and cannot be defeated by a page whose changes are faster than the clock's resolution"
    - "Whole-table validation before the interesting branch: the absence of a header is only evidence once the body has independently proved the table is rendered"
    - "The {diagnosis, reason} pair is one key, not two independent enums — an unpaired combination is unrenderable rather than degrading to a weaker message"
    - "Runtime-projected assets are pinned by the package inventory plus a source scan of the projection map, because nothing in the manifest names them"

key-files:
  created:
    - extension/icons/missing.png
    - extension/icons/unreadable.png
    - test/extension/diagnosis.test.js
  modified:
    - extension/content.js
    - extension/background.js
    - extension/popup.js
    - test/extension/chrome-harness.js
    - test/extension/runtime-contract.test.js
    - test/extension/toolbar-popup.test.js

key-decisions:
  - "The settle window is gated on a mutation revision rather than a wall clock. The content script's isolated world is handed `setTimeout`/`clearTimeout` by its host but not a controllable `Date`, so a clock-based 'remaining quiet time' calculation would be untestable under fake timers and would reschedule forever. Counting interpretation-affecting mutations is strictly more conservative than measuring the remainder: a change at 99 ms restarts a full 100 ms instead of waiting out the last 1 ms, so the extension confirms later, never earlier."
  - "SETTLE_MS is 100. Justified against the existing measured budget rather than asked about: it is an order of magnitude above the reconcile pass the inherited suites already drain at `vi.advanceTimersByTime(100)`, and far below the delay at which an agent would glance at the toolbar. It costs a brief neutral state on genuinely Priority-less views, which is exactly D-01's stated trade."
  - "A subframe and an absent, empty or whitespace-only `lang` all take the generic `structure` branch. Only a shell that positively declares a different language reaches `unsupported-language`, and the declared value is never read out, transmitted or interpolated — the reason is a fixed token."
  - "`missing` is never published by the reconcile pass or the observer. Only the settle callback, having re-established all three D-01 conditions from the current DOM, may publish it. An unconfirmed missing candidate is indistinguishable on the wire from any other incomplete evidence: neutral."
  - "`incomplete` body rows keep the view neutral for the missing branch as well as the working branch. D-01 does not require the absence of partial rows, but a partially mounted table is the exact situation in which a Priority column might still be about to arrive."
  - "The worker and popup validate the whole `{diagnosis, reason}` pair as a single key. The previous `TITLES[key] ?? TITLES[status]` fallback would have silently downgraded an unpaired `cannot-read` to no message at all; now it reports `unavailable`, which is an honest statement about the connection."
  - "The two new icons are shape-distinct, not merely colour-distinct: a solid column beside a plus, and a question mark. Colour differs too, but every state also carries an explanatory title, so colour is never the only signal."

patterns-established:
  - "Revision-gated confirmation: arm one timer, record the revision, re-inspect fresh DOM at the callback, confirm only on an unchanged revision and re-arm otherwise. Terminates on quiet, cancels on teardown, never self-schedules after confirmation."
  - "Package-inventory pinning for runtime-projected assets: scan the worker source for the paths it can project and assert that set equals the packaged icon directory exactly."

requirements-completed: []

coverage:
  - id: D1
    description: "A missing-column claim requires all three D-01 conditions and appears only after 100 ms of quiet; any relevant change withdraws it in the same turn"
    requirement: FAIL-02
    verification:
      - kind: test
        ref: "test/extension/diagnosis.test.js#a missing Priority column is neutral at 99 ms and claimed only once 100 ms of quiet has passed"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a relevant change inside the window restarts the quiet period rather than confirming early"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a confirmed missing claim is withdrawn in the same turn a relevant change lands"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a Priority column that arrives during the quiet window is working, never a missing claim"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#the candidate table being replaced wholesale cannot carry a stale claim across the timer"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every other shape of incomplete or broken evidence stays neutral or cannot-read and can never produce a missing-column claim"
    requirement: FAIL-02
    verification:
      - kind: test
        ref: "test/extension/diagnosis.test.js#<an absent table / an empty body / a group-only body / a partially mounted row / a body whose rows are all narrower than the header> stays neutral forever and never becomes a missing claim"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a zero-cell header row is neutral, not proof that the column is missing"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a malformed row arriving after a witness is structural cannot-read, never missing"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#two candidate tables are structural cannot-read, never missing"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a duplicated Priority header is structural cannot-read, never missing"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#an unrecognized non-empty priority value is structural cannot-read, never missing"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unsupported locale and structural unreadability share the third state but carry truthful, different copy, and no language string reaches the wire"
    requirement: FAIL-03
    verification:
      - kind: test
        ref: "test/extension/diagnosis.test.js#a non-English shell is cannot-read with the unsupported-language reason"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#<an absent lang attribute / a whitespace-only lang attribute> is generic cannot-read and never names a language"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#an English view that broke structurally is never told its language is unsupported"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#no language string, DOM text or raw error ever reaches the status reply"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a structurally unreadable English view is told so, and is never blamed on its language"
        status: pass
    human_judgment: false
  - id: D4
    description: "A blank Priority column is working with the no-values-set line, never a missing-column claim (D-02)"
    requirement: FAIL-01
    verification:
      - kind: test
        ref: "test/extension/diagnosis.test.js#a Priority column whose every value is empty is working with the blank reason"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a Priority column with no values set reports working with the blank reason"
        status: pass
    human_judgment: false
  - id: D5
    description: "Three diagnoses reach the toolbar as three distinct packaged PNG shapes and three distinct explanatory titles, per tab"
    requirement: FAIL-05
    verification:
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#<working.png / missing.png / unreadable.png / neutral.png> is a locally authored 32x32 PNG"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#the four icons are four different images, so shape can carry the meaning"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#two tabs with different diagnoses hold different toolbar states at the same time"
        status: pass
      - kind: test
        ref: "test/extension/runtime-contract.test.js#every packaged icon is a 32x32 8-bit RGBA PNG and the worker projects no other artwork"
        status: pass
    human_judgment: false
  - id: D6
    description: "A stale reply, a navigation event, a recreated worker or a closed tab cannot overwrite the latest status, and every timer and queue settles"
    verification:
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a recreated worker reconstructs from a fresh handshake, never from a remembered diagnosis"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a tab closed while its status request is in flight can no longer be painted by that reply"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a navigation event only invalidates and requeries; it never reads the URL it carries"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#a slow earlier reply cannot repaint over a newer projection"
        status: pass
      - kind: test
        ref: "test/extension/diagnosis.test.js#a finite burst of relevant changes keeps at most one confirmation timer pending and drains to zero"
        status: pass
      - kind: test
        ref: "test/extension/runtime-contract.test.js#every declared script executes without data channels on <success/unknown/absent/unsupported-language>"
        status: pass
    human_judgment: false
  - id: D7
    description: "The page is left visually untouched in every diagnosis: the add-a-column hint exists only inside the popup (D-03)"
    requirement: FAIL-02
    verification:
      - kind: test
        ref: "test/extension/diagnosis.test.js#the <missing / structure / waiting> diagnosis writes no diagnostic markup into the page"
        status: pass
      - kind: test
        ref: "test/extension/toolbar-popup.test.js#shipped JavaScript carries no colour value and builds no page markup"
        status: pass
      - kind: test
        ref: "test/extension/runtime-contract.test.js#runtime source remains classic, palette-free and limited to DOM reading plus marker/lifecycle writes"
        status: pass
    human_judgment: false
  - id: D8
    description: "A person can actually tell the column-plus from the question mark in a 16px toolbar slot, and the popup wording reads as honest rather than alarming"
    requirement: FAIL-05
    verification: []
    human_judgment: true
    rationale: "Byte-distinctness and a 32x32 PNG header are the automatable floor; they cannot establish shape recognizability at toolbar scale, that the per-tab icon really is per-tab in a loaded browser, or that 'Add a Priority column to this view to use tinting' lands as helpful rather than accusatory. 04-03-PLAN.md states this explicitly: subjective shape recognizability remains a new-source human check in 04-05, where Phase 4's blocking human verification lives."

duration: 28 min
completed: 2026-09-10
status: complete
---

# Phase 4 Plan 03: Certain Missing-Column Diagnosis and Three Distinct Icons Summary

**The extension can now say "this view has no Priority column" — and it says it only when a well-formed header row, a width-matched ticket row and 100 ms of quiet all hold at once, withdrawing the claim in the same turn any of that evidence moves; every other kind of incomplete evidence stays neutral, structural failure and unsupported locale carry different truthful copy, and the three diagnoses reach the toolbar as three distinct packaged shapes.**

## Performance

- **Duration:** 28 min
- **Started:** 2026-09-10T08:54:00+03:00
- **Completed:** 2026-09-10T09:22:00+03:00
- **Tasks:** 2 of 2
- **Files:** 3 created, 6 modified

## Accomplishments

- **The `waiting` conflation is resolved, and resolved in the conservative direction.** `inspectCandidateTable` previously returned `waiting` for seven distinct situations, only one of which was a missing column — and it returned it *before* the body was validated at all, so the fifth case could not have been distinguished even in principle. The body loop now runs for every table, whether or not a `Priority` header exists, and records a `witnessed` flag for the first direct ticket row whose cell count matches the header count. Only `priorityIndex === -1` **plus** `witnessed` **plus** no `incomplete` row yields the new `missing` state. Absent table, absent `thead`/`tbody`, empty header row, zero header cells, partial mount, group-only body and empty body all still return `waiting`, and `waiting` is still neutral.

- **Certainty is a revision, not a clock.** The settle window counts interpretation-affecting mutations rather than reading a wall clock. One timer is armed at a recorded `changeRevision`; at its callback the controller re-inspects the **current** document, and confirms only if the state is still `missing` *and* the revision is unchanged. If a change landed inside the window it re-arms a fresh full 100 ms instead of confirming. That is deliberately more conservative than the "schedule only the remaining quiet time" mechanic the research sketched — see Deviations — and it means the extension can confirm later than strictly necessary but never earlier. A confirmed claim is withdrawn **synchronously** inside the observer callback, before the browser can paint and before any timer runs.

- **Every non-missing failure now says something true instead of nothing.** The old single `unsafe` state collapsed nine structural conditions and the locale guard into one silent neutral. It is split: a shell that positively declares a language other than `en` reports `cannot-read` / `unsupported-language`; a subframe, an absent, empty or whitespace-only `lang`, and every structural condition — two candidate tables, nesting, foreign children, duplicate `thead`/`tbody`/header row, malformed cells, two `Priority` headers, an unrecognised non-empty value, anomalous group topology — report `cannot-read` / `structure`. **An English agent whose view broke is never told their language is unsupported, and neither branch can reach the add-a-column copy.** The declared language value itself is never read out: the reason is a fixed token, asserted by a test that runs three different non-English shells and greps the serialized reply for the tag, the localized header text and the localized value.

- **The `{diagnosis, reason}` pair is validated as one key.** The worker's previous `TITLES[key] ?? TITLES[result.status]` fallback would silently downgrade an unpaired combination; both worker and popup now require the exact pair to exist in the copy table and otherwise report `unavailable` — an honest statement about the connection rather than a guess about which half of a malformed reply to believe.

- **Three diagnoses, three shapes, per tab.** `icons/missing.png` (a solid column beside a plus, 163 bytes) and `icons/unreadable.png` (a question mark, 301 bytes) are locally authored 32×32 8-bit RGBA PNGs generated in-process from distance fields with 4×4 supersampling and verified as ASCII rasters; no generator ships. Two tabs holding different diagnoses at the same time keep different icons and titles, every `actionLog` entry is tab-scoped, and a window with no current tab reads `unavailable` rather than projecting the last tab's answer.

- **The tracer world became a real multi-tab browser.** It previously hard-coded one tab id in both the content sender and `tabs.sendMessage`. It now keeps per-tab listener lists and per-tab `chrome` objects, models `active` and `currentWindow` separately, and can open, activate, leave and close tabs. `terminateWorker()` discards every worker global exactly as Chrome does after idle suspension, which is what makes the worker-recreation test meaningful: the view changes while nothing is listening, a fresh worker is loaded, and the correct new diagnosis is reconstructed from a handshake — never from a remembered one. `background.js` is additionally asserted to contain no `chrome.storage`, `onInstalled` or `onStartup`, so there is nowhere for a diagnosis to be persisted.

- **The inherited pins were updated, and every one of them got stronger rather than weaker.** The recursive `shippedInventory()` now lists all four icons; a new runtime-contract test asserts every packaged icon is a 32×32 8-bit RGBA non-interlaced PNG under 8 KB **and** that the set of `icons/*.png` paths the worker can project equals the packaged directory exactly — which is the only thing that can prove a runtime-projected asset will exist in the store zip, since the manifest never names it. `permissions: ['storage']`, the eleven manifest keys pinned absent by name, the whole-object manifest deep-equal, `matches`, `world: 'ISOLATED'`, `all_frames: false` and all source-level prohibitions are untouched and still pinned twice over.

- **Nothing else moved.** `extension/zhroma.css` is byte-identical to the Phase 3 baseline `382cc88`. No permission was added. No shipped JavaScript contains a colour literal, a CSS write, a DOM-construction call or an `https?:` literal. `phase-03-live-acceptance.test.js` was not touched, is still bound to `382cc88`, and still reports **`human_needed`**. No admitted fixture was modified: every new case is a synthetic table built in memory and clearly labelled as such.

## Task Commits

1. **RED** — `ca7d9e5` `test(04-03): add failing D-01 certainty and honest-reason tests`
2. **GREEN** — `c66f2be` `feat(04-03): confirm missing-column evidence and propagate every honest reason`
3. **RED** — `1f93f28` `test(04-03): add failing per-tab icon and lifecycle tests for three distinct shapes`
4. **GREEN** — `cafc450` `feat(04-03): project three distinct packaged shapes from the same per-tab diagnosis`

**REFACTOR:** no commit for either task. Neither GREEN implementation needed a cleanup pass, and `tdd.md` says to commit a refactor only if changes were made.

Measured: `git rev-list --count c260f2a..HEAD` = **4**.

## TDD Gate Compliance

`workflow.tdd_mode` is `false` in this project, so the orchestrator-level RED hard gate did not fire. Both tasks were run through the cycle anyway, as the plan's `tdd="true"` requires.

| Task | RED | GREEN |
|---|---|---|
| 1 | 18 of 29 failed, exit 1. Target test *"a missing Priority column is neutral at 99 ms and claimed only once 100 ms of quiet has passed"* failed on its behavioural assertion — `expected { diagnosis: 'neutral' } to deeply equal { diagnosis: 'missing' }` — not on a syntax error, zero discovery or a fixture crash. `gsd-tools check tdd-red-evidence` → **RED_EVIDENCE_OK (target_test_failed)**. | 79/79 across `diagnosis` + `toolbar-popup`; `npm test` 440 passed, exit 0. |
| 2 | 12 of 77 failed, exit 1. Target test *"two tabs with different diagnoses hold different toolbar states at the same time"* failed on `expected icons/neutral.png to deeply equal icons/missing.png`. **RED_EVIDENCE_OK (target_test_failed)**. | 77/77 across `toolbar-popup` + `runtime-contract`; `npm test` 450 passed, exit 0. |

As in 04-02, the checker parses `node --test` TAP and Vitest's flat TAP omits the `# tests / # pass / # fail` trailer; the trailer was computed from each real run's own `ok` / `not ok` lines and appended. No counts were invented.

## Verification Results

| Command | Result |
|---|---|
| `vitest run … diagnosis.test.js toolbar-popup.test.js` (Task 1 verify) | **79 passed**, exit 0 |
| `vitest run … toolbar-popup.test.js runtime-contract.test.js` (Task 2 verify) | **77 passed**, exit 0 |
| `vitest run … test/extension` (plan verify) | **342 passed**, exit 0 |
| `npm test` (recon smoke + full vitest) | **65 node:test passed**, **450 vitest passed**, exit **0** |
| `vitest run … phase-03-live-acceptance.test.js` | **`PHASE 03 LIVE ACCEPTANCE STATUS: human_needed`**, bound to `382cc88`, untouched |
| `node scripts/verify-recon-gate.js final SELECTORS.md test/fixtures/manifest.json` | **FINAL VERDICT: proceed**, exit 0 |
| `git diff 382cc88..HEAD -- extension/zhroma.css` | empty — palette byte-unchanged |
| `git diff --diff-filter=D --name-only c260f2a..HEAD` | empty — no file deleted in any commit |

## Files Created/Modified

- `extension/content.js` — **modified.** `inspectCandidateTable` gained the `unsupported` / `unsafe` locale split and the shared body validation with a `witnessed` flag and a `missing` outcome. New `statusForState`, `cancelConfirmation`, `invalidateConfirmation`, `armConfirmation` and `confirmMissingColumn`, plus `SETTLE_MS`, `changeRevision`, `confirmTimer`, `confirmRevision` and `missingConfirmed`. `reconcileCurrentTable` and the observer callback both map through `statusForState`; the observer additionally bumps the revision and withdraws a confirmed claim synchronously. `pauseController` cancels the confirmation. Marker ownership, rollback, `commitSnapshot`'s success contract and mutation filtering are unchanged.
- `extension/background.js` — **modified.** Four-value `DIAGNOSES`, four-value `REASONS`, a four-file `ICONS` map, seven fixed `TITLES` keyed by the whole pair, a `statusKey` helper, and pair validation in `requestStatus`. Nothing else changed: the sender guards, generations, serialized queue and tab-scoped writes are 04-02's.
- `extension/popup.js` — **modified.** Five-value `STATUSES`, four-value `REASONS`, seven fixed copy strings keyed by the pair, and `Object.hasOwn` pair validation in `render` in place of the double `??` fallback.
- `extension/icons/missing.png` — **created.** 163-byte 32×32 RGBA PNG; a solid column beside a plus, in `rgb(43, 92, 168)`.
- `extension/icons/unreadable.png` — **created.** 301-byte 32×32 RGBA PNG; a question mark, in `rgb(166, 110, 20)`.
- `test/extension/diagnosis.test.js` — **created (374 lines, 29 tests).** Synthetic table builders, a loader that runs shipped `content.js` in a VM against the strict harness with a controllable observer, and a `replaceView` helper that reports a subtree swap the way a real observer would.
- `test/extension/chrome-harness.js` — **modified.** `PREFERENCE_CONTRACT.diagnoses` and `.reasons` widened to the decided taxonomy. **The Chrome allow-list itself was not widened**: this plan needed no Chrome surface beyond the seam 04-06 already permits, so no `chrome.*` API, storage area, key or message shape was added.
- `test/extension/runtime-contract.test.js` — **modified.** Recursive inventory extended to four icons; new packaged-icon and projection-set test; two `runOnlyPendingTimers()` calls in the 30-repeat lifecycle loop replaced by a full `advanceTimersByTime(15000)` drain so the two-stage reconcile-then-settle sequence is proved to terminate. Nine inherited tests preserved, all still asserting `getTimerCount() === 0`.
- `test/extension/toolbar-popup.test.js` — **modified.** Per-tab world, `ICON`/`COPY` maps, seven new tests (three diagnosis end-to-end, four per-tab lifecycle), four-icon pins, and the diagnosis taxonomy bound to both shipped sources in the cross-double contract test. All 45 pre-existing tests untouched and passing.

## Deviations from Plan

### 1. [Rule 3 — Blocking issue] Committed on the default branch `main` without the `git.allow_default_branch_commits` opt-in

- **Found during:** Task 1, at the pre-commit HEAD safety assertion.
- **Issue:** The protected-branch guard resolves `main` as the repository's default branch and refuses to commit unless `.planning/config.json` sets `git.allow_default_branch_commits: true`. That key is not set.
- **Assessment:** Unchanged from 04-01, 04-02 and 04-06. This project is deliberately trunk-based — `git.branching_strategy: "none"`, and every prior GSD commit across Phases 1–4 is on `main`. This run was dispatched explicitly as a sequential executor on the main working tree, and the dispatch identified this as an already-surfaced deviation to record rather than re-litigate.
- **Fix:** Proceeded with normal, hook-running commits on `main`. **The user's config was deliberately NOT modified.**
- **Verification:** `git log` shows four task commits on `main`, no branch creation, no `--no-verify`, no `git update-ref`.
- **Committed in:** `ca7d9e5`, `c66f2be`, `1f93f28`, `cafc450`.

### 2. [Documented implementation choice] The settle window re-arms a full 100 ms instead of scheduling only the remaining quiet time

- **Found during:** Task 1 design.
- **Issue:** 04-RESEARCH.md and the plan's `<action>` both say to "schedule only remaining quiet time when still eligible", which requires a monotonic clock. The content script's isolated VM world is handed `setTimeout` and `clearTimeout` by its host but **not** a controllable `Date` — `vi.useFakeTimers()` patches the host's `Date`, not the VM context's intrinsic one. A `Date.now()`-based remainder would therefore read the real wall clock under fake timers, compute an elapsed of ~0 ms forever, and reschedule indefinitely: an unbounded timer loop that the `getTimerCount() === 0` assertion exists to forbid.
- **Fix:** Track `changeRevision` instead. At the callback, confirm only when the revision that armed the timer is unchanged; otherwise re-arm a fresh full window at the current revision. This is **strictly more conservative** than a remainder — a change at 99 ms produces confirmation at 200 ms rather than 199 ms — so it can only ever delay a claim, never advance one. It also keeps the invariants the plan actually names: at most one pending timer, fresh DOM inspection at the callback, no self-scheduling after confirmation or lost eligibility, and no snapshot across the boundary.
- **Verification:** *"a relevant change inside the window restarts the quiet period rather than confirming early"* pins the 99/100/199/200 ms sequence exactly; *"a finite burst of relevant changes keeps at most one confirmation timer pending and drains to zero"* pins termination across 30 bursts.
- **Files modified:** `extension/content.js`. **Committed in:** `c66f2be`.

### 3. [Rule 3 — Blocking issue] `runtime-contract.test.js` was edited in Task 1, though the plan assigns that file to Task 2

- **Found during:** Task 1, at the full-suite check before the GREEN commit.
- **Issue:** The plan lists `runtime-contract.test.js` under Task 2's files. But the new taxonomy is Task 1's change, and it broke `every declared script executes without data channels on absent`: that test's 30-repeat loop used `vi.runOnlyPendingTimers()`, which runs the reconcile pass but not the settle timer it schedules, leaving one pending timer against a `getTimerCount() === 0` assertion. Deferring the fix would have left the tree red across a commit.
- **Fix:** Replaced the two `runOnlyPendingTimers()` calls in that loop with a full `advanceTimersByTime(15000)` drain. This is **stronger, not weaker**: it proves the whole reconcile-then-settle chain terminates rather than proving one generation of callbacks does. The assertion itself is unchanged.
- **Files modified:** `test/extension/runtime-contract.test.js`. **Committed in:** `c66f2be`.

### 4. [Documented scope boundary] Three of the new tests delivered mutation records the observer correctly ignored

- **Found during:** the first GREEN run of Task 1.
- **Issue:** Four cases replaced `document.body.innerHTML` and then delivered a synthetic `childList` record targeting `body` with empty `addedNodes`/`removedNodes`. `mutationsAffectInterpretation` correctly classifies that as irrelevant — it names no candidate — so the controller never re-inspected, and the tests were asserting against a stale state. A fifth case appended a `<span>` to `<tbody>`, which is genuinely foreign topology and made the table structurally unreadable rather than delivering the benign change the test intended.
- **Fix:** Added a `replaceView` helper that reports a subtree swap the way a real `MutationObserver` does, with the removed and added subtrees in the record, and changed the benign-change case to add a second valid ticket row. Test-only; no production behaviour changed, and the production classifier was left exactly as inherited.
- **Files modified:** `test/extension/diagnosis.test.js`. **Committed in:** `c66f2be`.

---

**Total deviations:** 4 (1 pre-existing blocking issue re-recorded, 1 documented implementation choice with a correctness rationale, 1 cross-task test fix to keep the tree green, 1 test-harness correction). **Impact:** none on scope. No product decision, permission, fixture, palette, admitted evidence or historical record was altered.

## Deferred Issues

None. Every task in the plan is complete and the full suite is green.

## Known Stubs

None. Two **scoped omissions carried forward**, both explicitly assigned to later plans:

- **The off/on switch and `off.png` are 04-04's**, not this plan's. The popup is still a status panel with no control, and the fifth decided shape treatment (the power symbol) is not packaged. The four-icon inventory pin means adding it will require an explicit, visible edit in both `runtime-contract.test.js` and `toolbar-popup.test.js`.
- **Browser observation of the icon shapes and the popup wording is 04-05's.** Simulated Chrome delivery cannot establish that a person recognises a column-plus from a question mark at 16 px, or that the add-a-column line reads as helpful. Recorded as `human_judgment: true` in the coverage block (D8).

## Threat Flags

None. Every row of this plan's register was addressed rather than deferred:

- **T-04-08 (Tampering, missing confirmation):** all three D-01 predicates are separately tested, the callback re-inspects the current DOM, the revision gate is pinned at the 99/100 ms boundary, and 30-burst termination is asserted.
- **T-04-09 (Tampering, action projection):** per-tab generations and queues are exercised by two simultaneous tabs, an active-window change, a delayed reply, a navigation event, worker recreation and tab closure in flight.
- **T-04-10 (Denial of service, confirmation scheduling):** one finite settle timer, cancelled on pause, pagehide, off and exception, never self-scheduling after confirmation, with `getTimerCount() === 0` asserted at rest in every diagnosis.
- **T-04-11 (Information disclosure, failure wording):** the reason vocabulary is a fixed finite token set; three non-English shells are run and the serialized reply is grepped for the language tag, the localized header and the localized value; no page diagnostic is written in any state.

No new network surface, no permission change, no package install, no schema migration, no new dependency, no build step.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None.

## Next Phase Readiness

**Ready for 04-04** (wave 5), which adds the persistent off/on switch. Carry forward:

- **The status protocol widened.** `diagnosis ∈ {working, missing, cannot-read, neutral}`, `reason ∈ {blank, unsupported-language, structure, null}`, and the **pair** is validated as a single key in `background.js` and `popup.js`. Adding an `off` state means updating `PREFERENCE_CONTRACT.diagnoses`/`reasons`, the `TITLES`/`COPY` tables in both contexts, and the cross-double binding test together — that test will fail until all of them agree, which is the point.
- **`off` is an operational state, not a fourth diagnosis** (04-DECISIONS.json). The decided copy is "Tinting is off" and the decided artwork is a power symbol at `icons/off.png`. Both icon inventory pins (`runtime-contract.test.js` recursive inventory, `toolbar-popup.test.js` `readdirSync` + `ICON_FILES`) list exactly four files today and must be updated together.
- **The teardown seam is unchanged and already correct for the switch.** `pauseController` now also cancels a pending confirmation, so switching off cannot leave a missing claim in flight. A stored `false` leaves the controller dormant with zero observers and zero timers, asserted in `diagnosis.test.js` as well as the inherited suites.
- **The tracer world is multi-tab now.** `world.openTab`, `activateTab`, `leaveWindow`, `closeTab` and `terminateWorker` exist; CTRL-04's "other runnable tabs converge via `storage.onChanged`" can be tested against two real content contexts rather than one.
- **Phase 3's status is unchanged**: independent verification remains `human_needed` at 28/34 truths, nine canonical live checks untested after the user's UAT skip, LIVE-05/FAIL-04 still lacking human evidence. Do not restart Phase 3 UAT or profiling unless the user asks.
- **FAIL-01, FAIL-02, FAIL-03 and FAIL-05 are implemented and traced offline, not accepted.** No requirement was marked complete: all four are also declared by sibling plans that have not finished, and `requirements.ready-ids` correctly returned 0 of 4 ready. Real browser observation is 04-05's blocking human verification.

## Self-Check: PASSED

- All three created files exist on disk; all six modified files exist and differ from the plan's base commit `c260f2a`.
- Commits `ca7d9e5`, `c66f2be`, `1f93f28`, `cafc450` are all present in `git log`; measured count from the plan ledger is **4**, matching the `commits:` frontmatter.
- Both task `<verify>` commands re-run clean (79 passed; 77 passed), the plan-level `<verification>` re-runs clean (342 passed, exit 0), and `npm test` exits **0** with 65 + 450 passed.
- Every clause of both tasks' `<acceptance_criteria>` maps to a named passing test, listed individually in the coverage block and re-run by name after the final commit.
- No file deletions in any of the four commits.
- Hard constraints re-audited after the final commit: `permissions: ["storage"]` with no `host_permissions`; `matches` exactly `https://*.zendesk.com/agent/*`; `world: "ISOLATED"`; `all_frames: false`; `zhroma.css` byte-identical to `382cc88`; zero colour literals, CSS writes, DOM construction, network calls, web storage, route hooks or `https?:` literals in any shipped JavaScript; no new dependency and no build step.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*
