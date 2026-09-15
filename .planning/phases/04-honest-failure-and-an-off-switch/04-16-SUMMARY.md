---
phase: 04-honest-failure-and-an-off-switch
plan: "16"
subsystem: extension-runtime
tags: [preference, deadlines, native-ownership, popup, lifecycle, tdd]
status: complete
completed: 2026-09-11
duration: 18min
duration_basis: First RED commit through task closeout; earlier context loading was not timed
requires:
  - phase: 04-15
    provides: Confirmed-save repair and explicitly approved uncertainty/native-limit contract
  - phase: 04-17
    provides: Final locale diagnosis and synthetic Chrome rendering baseline
provides:
  - Absolute admission budgets and bounded preference queue with physical write exclusion
  - Exact nullable outcome and fresh popup ownership/recovery
  - Physically serialized native actions and bounded coalesced per-tab observation
  - Independent native scheduling, retained-entry measurement and faithful worker epochs
affects: [04-18, 04-19, 04-20]
tech-stack:
  added: []
  patterns: [absolute observation budgets, native settlement ownership, latest-candidate coalescing]
key-files:
  created:
    - .planning/phases/04-honest-failure-and-an-off-switch/04-16-TASK1-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-16-TASK2-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-16-TASK3-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-16-GREEN.json
  modified:
    - extension/background.js
    - extension/popup.js
    - test/extension/tracer-world.js
    - test/extension/preference-outcome.test.js
    - test/extension/toggle.test.js
    - test/extension/popup-recovery.test.js
    - test/extension/failure-seam.test.js
    - test/extension/worker-integrity.test.js
    - test/extension/toolbar-popup.test.js
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PREFERENCE-CONTRACT.md
key-decisions:
  - Preserve the exact approved unknown copy and mixed disabled native checkbox
  - A saved=false/null-read reply cannot safely resurrect lastConfirmed because it can represent refusal behind another pending writer
  - Keep physical action ownership independent from request and projection observation budgets
  - Use worker-VM Map instrumentation and epoch-gated APIs only in the tracer
requirements-completed: []
requirements-addressed: [CTRL-02, CTRL-03, CTRL-04, FAIL-05]
verification_status: focused-tests-passed-independent-review-pending
plan_head_before: 4b73037682fa62a02fc59c06252733b0ae251e46
actuals:
  tokens: 61333
  tasks: 3
  commits: 6
  basis: ceil(245329 realized diff characters / 4), including raw RED evidence; commit count measured before this summary commit
coverage:
  - id: D1
    description: Bounded truthful preference outcomes across both directions and independent stalled hops
    verification:
      - kind: integration
        ref: test/extension/preference-outcome.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: Exact unknown protocol, fresh popup ownership and consumer agreement
    verification:
      - kind: integration
        ref: 04-16-GREEN.json
        status: pass
    human_judgment: false
  - id: D3
    description: Native action reconciliation, bounded closed-tab retention and epoch-faithful side effects
    verification:
      - kind: integration
        ref: test/extension/toolbar-popup.test.js
        status: pass
    human_judgment: false
---

# Phase 04 Plan 16: Bounded Preference Outcomes and Native Ownership Summary

**The worker answers within a 4000 ms admission budget while retaining issued
storage/action ownership until native settlement; the popup explicitly shows
uncertainty and recovers from a fresh opening/focus confirmation.**

All three tasks are complete. Six focused suites pass 364 tests. This is synthetic
actual-source integration evidence, not independent review, mutation sensitivity,
live Chrome suspension/restart, or current-build Zendesk acceptance.

## Task commits

| Task | RED | GREEN | Result |
|---|---|---|---|
| 1 — stalled native operation and honest response | a9d9d47 | 5f0f4ef | 32 focused cases passed |
| 2 — complete outcome table and consumer agreement | 16aa72e | 4e1b5fc | Five focused suites, 269 passed |
| 3 — late artwork effects and actual lifetime limits | ac8c585 | 3ad8a58 | Final six-suite integration, 364 passed |

Plan base is the persisted `.git/gsd-plan-head-before-04-16` ledger. Six task
commits were measured with `git rev-list --count base..HEAD` before this summary.
The following metadata commit necessarily increases a later HEAD-based count;
the recorded count is the task-closeout measurement, not a narrated estimate.

## TDD Gate Compliance

Each task has a RED commit before its GREEN implementation commit. All three
persisted RED records returned `RED_EVIDENCE_OK` from the GSD checker.

| Record | Executed | Failed intentionally | Passed | Target |
|---|---:|---:|---:|---|
| 04-16-TASK1-RED.json | 32 | 12 | 20 | No actual worker answer after a parked read exceeded 4000 ms |
| 04-16-TASK2-RED.json | 195 | 65 | 130 | Opposite-popup overload restored an obsolete confirmed checkbox during a pending native write |
| 04-16-TASK3-RED.json | 13 | 8 | 5 | A popup dispatched a second native icon while the prior physical icon remained held |

The records preserve raw Vitest tap-flat output and explicitly describe their
Node-TAP summary adapter. Counts derive from actual result lines; Task 3 excludes
name-filter skips from its executed count. No discovery, fixture, syntax or
unrelated assertion failure authorized GREEN. No optional refactor commit was
needed; task implementations include the associated consumer integration.

## Adversarial outcomes demonstrated

- Both starting booleans pass independent worker-read, tabs.query, icon and
  title holds. Traffic contains actual worker response timestamps within the
  budget, before the popup fallback; harness ports stay open beyond both limits.
- Uncommitted writes and commit-before-callback writes return saved=null.
  Reopened/focused popups remain mixed even when a fresh read sees the physically
  committed value. Callback settlement alone releases the raw writer.
- A 32-request admission limit rejects overflow immediately. Waiting input
  expires inert, and later drain never dispatches it. Healthy bursts preserve
  explicit arrival order. Named physical-write observations never exceed one
  inside a worker epoch, including response expiry and opposite popups.
- The 160-case joint matrix crosses both initial booleans with four write modes,
  five read modes and four application replies. Existing additional cases cover
  throwing and malformed content reads, definitive write faults, failed native
  marker cleanup, lastError-with-values and actual keyboard-focus modeling.
  Storage, displayed certainty, copy, markers and application acknowledgements
  are observed jointly rather than inferred from final storage alone.
- Sequential held stages spend one admission budget. An existing actual-timer
  real-popup/worker/silent-document round trip confirms the worker response and
  usable confirmed save; numeric source comparison is secondary documentation.
- Opening refresh excludes change/focus overlap. Captured stale refresh and
  change replies cannot replace newer recovered UI. Transport failure is unknown,
  while saved=false is a definite unsuccessful/non-started save. Null read-back
  on that latter path stays mixed because it may reflect another pending writer.
- Both icon and title holds retain physical exclusion across popup timeouts and
  forty invalidations. A neighbour and its popup remain responsive. After release,
  fresh reconciliation leaves the latest icon/title, and timers drain.
- Event-originated parked reads/status replies recover after their own absolute
  budget with no popup or worker recreation. A query timeout cannot discard the
  native action owner. Coalescing retains one latest observation/candidate.
- Closure at query/read/status/icon/title stages releases mapped entries and
  prevents stale follow-on paint. Thirty create/close cycles do not grow retained
  entries. A closed native target cannot commit onto a reused id's new incarnation.
  Attempted action calls and committed native paints are separate observations.
- Epoch tests preserve issued storage/icon/title effects while blocking every
  later dead-worker API dispatch, callback, timer and promise continuation.
  A deliberate old-write-after-new-worker-write schedule exhibits the approved
  cross-epoch ordering limit; fresh opening recovers the actual current boolean.
- Content's existing preferenceGeneration guard rejects a read callback released
  after the worker timed out and a newer explicit preference was stored. Request
  id guards for application remain separate from toolbar projection generation.

All final cases use bounded primitive protocol observations and assert forbidden
channels remain empty where relevant. No new storage key, permission, package,
network endpoint or production diagnostic API was added.

## Final verification

`04-16-GREEN.json` preserves the final command, raw output, counts and all 25
historical assertion-marker locations. The command covers toggle,
popup-recovery, failure-seam, worker-integrity, toolbar-popup and
preference-outcome: **6 files, 364 passed, 0 failed, 16.29 seconds, exit 0**.
It contains every plan-required focused suite. The earlier Task 3 two-suite
command passed 292 tests before the final combined check. Syntax checks for both
changed shipped scripts and `git diff --check` passed. No tracked deletions were
introduced. No whole-repository green or mutant kill is claimed.

## Accepted limits and historical dispositions

The user's exact 04-15 `approved` response remains the authority for these limits:
a never-settling native write can keep further changes unavailable; a native
action can remain held until Chrome settles it; transient stale native artwork
cannot be recalled by a timer; one stored boolean cannot serialize writes across
worker termination. Synthetic scheduling demonstrates these limits rather than
claiming they have been remediated. Popup output is a fresh-request snapshot,
with focus/open recovery and no continuous polling.

WINDOWS20/21's individually redundant generation sites remain mechanism-level
evidence. Historical claims that every individual guard deletion must fail are
not silently restored. The old `serializePreference` rejection handler was removed
with its obsolete implementation. Popup render fallback is now also redundant
behind exact status/reason pair validation: 04-18 must classify or retarget it
honestly. All 25 existing ids have their own `[mutant:ID] assertion marker, but
marker presence is not proof that a literal is current or that a mutant is killed.

04-14 truth 4 / WINDOWS22 now have direct synthetic retention and absent-paint
observations. The former shape-only cleanup checks and test expecting a dead-tab
paint have been replaced; historical plans/summaries are unchanged. A spurious
dead-id event may create a bounded validation candidate, which is discarded
without native action dispatch after the identity check. It cannot revive removed
ownership. 04-19 independently assesses the current contract and these residuals.

## Deviations from Plan

1. **[Rule 1 — Bug] Task 2 required a related popup correction.** Its new overload
   counterexample found that saved=false/ enabled=null could restore an old
   checkbox while another raw writer remained pending. The null shape cannot
   distinguish refusal from failed read-back, so it conservatively displays a
   mixed disabled control while retaining definite not-saved copy. RED 16aa72e;
   fix 4e1b5fc. This changes popup.js during Task 2, within overall plan ownership.
2. **[Rule 2 — Correctness] Query failure preserves native action ownership.**
   Removing state on an observation failure would permit a new state to dispatch
   a parallel native action. State deletion now excludes a physical owner;
   a named held-query counterexample verifies it in 3ad8a58.
3. Additional plan-local raw RED/GREEN records implement the required TDD and
   reviewable evidence contract. No installed tooling or dependencies changed.

No authentication gate occurred. No known implementation stubs, skipped tests,
unrun required verification, or newly introduced security endpoint remains.
No new threat surface outside the plan's popup/native/lifetime boundaries was found.

## Integration handoff

04-18 owns current-literal mutation registration and behavioral measurement;
04-19 owns independent code/security review; 04-20 alone owns final source/timing
binding and authentic human acceptance. Existing live binding is expected stale
after runtime changes. No acceptance hashes, observations, requirements, AR-04-01,
ACK-04-01, WINDOWS statuses, or Phase 3 human_needed state were promoted.

Per the orchestrator's explicit ownership assignment, shared STATE/ROADMAP/
REQUIREMENTS bookkeeping and any cross-phase deviation-ledger additions are left
to the parent. This executor used the existing codex/phase04-gap-closure branch
sequentially because worktree base discovery was unavailable. It did not create
or switch branches. Unrelated config.json, state.json, .gsd/, milestone.lock and
ui-reviews/ dirt remains outside all task commits.

## Self-Check: PASSED

All fourteen task-created/modified paths exist; all six RED/GREEN commits resolve;
the final six-suite run executed 364 tests with zero failures. Post-commit tracked
deletion checks are empty. The summary exists on disk for the orchestrator.
