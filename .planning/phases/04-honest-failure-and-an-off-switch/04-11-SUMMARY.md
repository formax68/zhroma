---
phase: 04-honest-failure-and-an-off-switch
plan: "11"
subsystem: testing
tags: [acceptance-record, sha256, promotion-rule-3, bcp47, workload-harness, provenance, vitest]

requires:
  - phase: 04-07
    provides: "The case-insensitive English-family predicate in content.js and the !important tint rules in zhroma.css — the two moved assets that invalidated the old binding"
  - phase: 04-08
    provides: "The worker's bounded hops in background.js and the re-runnable test:mutants gate"
  - phase: 04-09
    provides: "The dormant run mode, the runtime field, and the changed harnessHash that made the old samples file unmergeable"
  - phase: 04-10
    provides: "The truthful, usable switch in popup.js and the popup-vs-worker deadline ordering"
provides:
  - "An acceptance record bound to the eleven bytes that actually ship, with a computed human_needed disposition"
  - "history/2026-09-10-before-review-repair/ — the fourteen attested observations and the original timing samples, preserved verbatim against revision 77b3a19"
  - "english-regional-locale — a seventeenth check id giving the CR-01 repair its own live-evidence slot, plus the language-context rule that pins it"
  - "Seven-run timing evidence on final source: six canonical runs plus 30-dormant, timingStatus passed"
  - "04-05-SUMMARY.md — the missing completion record, explicitly marked as reconstructed from commits"
  - "ACK-04-01 — the outstanding acknowledgement that the user's fourteen attestations no longer count"
affects: [04-12, 04-13, 04-14, phase-04-verification, 05 store submission]

actuals:
  tokens: 41500
  tasks: 3
  commits: 3
  note: "chars/4 over the authored diff. Deliberately EXCLUDES 04-PERFORMANCE-SAMPLES.json (1.4 MB of machine-generated measurement, in the tree twice). Including it would report ~1M tokens and destroy the calibration signal rather than improve it."
plan_head_before: 77b3a19f3f96fa99b97b47930cd44f75bc52dd57

tech-stack:
  added: []
  patterns:
    - "Re-establish, never re-point: when shipped bytes move, an acceptance record is rebuilt from the new bytes and the old observations become dated history, because an observation is evidence about the bytes it was taken on"
    - "A new shipped behaviour gets a live-evidence slot even when nobody can observe it yet — a pending check is honest, an absent check is a silent gap"
    - "Derive every digest from the working tree; a transcribed hash is a claim, a computed one is a measurement"
    - "An outstanding acknowledgement is a repository artifact (ACK-04-01) as well as a harvested prompt, so it survives the session that raised it"

key-files:
  created:
    - .planning/phases/04-honest-failure-and-an-off-switch/history/2026-09-10-before-review-repair/README.md
    - .planning/phases/04-honest-failure-and-an-off-switch/history/2026-09-10-before-review-repair/04-LIVE-ACCEPTANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/history/2026-09-10-before-review-repair/04-PERFORMANCE-SAMPLES.json
    - .planning/phases/04-honest-failure-and-an-off-switch/history/2026-09-10-before-review-repair/04-PERFORMANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/history/2026-09-10-before-review-repair/04-VALIDATION.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-05-SUMMARY.md
  modified:
    - .planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-VALIDATION.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-RISK-ACCEPTANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
    - test/extension/phase-04-live-acceptance.test.js
    - .planning/ROADMAP.md
    - .planning/WINDOWS.md

key-decisions:
  - "The fourteen attested observations are preserved as dated history and NOT carried forward — three independent mechanisms forbid the carry-over, and no amount of record editing transfers evidence between byte sets"
  - "english-regional-locale is added as a seventeenth check because the CR-01 repair ships a behaviour no existing check covered; a shipped behaviour with no live-evidence slot is the silent gap promotion rule 3 exists to prevent"
  - "The re-enable-not-pressured ratification is QUALIFIED rather than carried intact: popup.js changed, so the popup the user judged is not the one that ships"
  - "actuals.tokens excludes the 1.4 MB machine-generated samples file; a calibration number dominated by measurement output measures nothing"
  - "independent_code_review is recorded as performed-on-pre-repair-source rather than not-performed or passed — 04-REVIEW.md exists, and the repairs it caused have not been re-reviewed"

patterns-established:
  - "History-directory preservation with an explicit not-validated sentence, following the Phase 3 precedent"
  - "A reconstructed completion record states its provenance in its own first paragraph and claims no first-hand observation"

requirements-completed: [FAIL-01, FAIL-02, FAIL-03, FAIL-05, CTRL-02, CTRL-03, CTRL-04]

coverage:
  - id: D1
    description: "The acceptance record binds to the bytes that actually ship: all eleven assets hash to the recorded values, inventory_count matches, and the disposition is computed rather than asserted"
    requirement: "FAIL-01"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#the repository record binds to every current shipped byte and reports its actual status"
        status: pass
      - kind: unit
        ref: "npm test — 65 node --test + 574 Vitest across 16 files, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fourteen user-attested observations are preserved verbatim as history against the revision they were taken on, and none is re-pointed at the repaired bytes"
    verification:
      - kind: manual_procedural
        ref: "shasum -a 256 of the preserved copy equals git show HEAD:…/04-LIVE-ACCEPTANCE.md for all four preserved artifacts; the preserved copy still shows 14 pass / 2 pending"
        status: pass
      - kind: unit
        ref: "grep -c '\"status\": \"pass\"' on the live record prints 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every inherited check reads pending against the new bytes, and the two FAIL-03 checks that were never observed stay pending with AR-04-01 intact and unpromoted"
    requirement: "FAIL-03"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#unavailable-must-remain-pending gate; 17 pending / 0 pass in the repository record"
        status: pass
    human_judgment: false
  - id: D4
    description: "The new English-regional-locale behaviour has a live-evidence slot rather than shipping with none, and that slot is pending"
    requirement: "FAIL-03"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#rejects bare en claimed as an English REGIONAL locale / a non-English tag claimed as an English regional locale / a near-miss primary subtag claimed as English / a missing language context on the English-regional check"
        status: pass
    human_judgment: false
  - id: D5
    description: "Browser timing is measured on final source: six canonical runs plus a dormant run, in a fresh file, with the previous samples retained as history"
    requirement: "CTRL-02"
    verification:
      - kind: integration
        ref: "node scripts/run-tint-workload.js — 7 run keys, timingStatus passed, identity.hashes equal to the working-tree digests"
        status: pass
    human_judgment: false
  - id: D6
    description: "The three ratified prohibition judgments are still carried as flagged-unverified, so no executor can self-ratify them"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#the repository record carries all three prohibition judgments as flagged-unverified"
        status: pass
    human_judgment: false
  - id: D7
    description: "Plan 04-05's completion record exists and states its own provenance as a reconstruction from commits rather than as a first-hand execution report"
    verification:
      - kind: manual_procedural
        ref: "04-05-SUMMARY.md first paragraph; names commits 75bb8b6, 1c60b91, 4678d17, f86592e; claims no live observation"
        status: pass
    human_judgment: false
  - id: D8
    description: "The user's fourteen attestations are not written off silently: an outstanding acknowledgement item exists that no automated step can answer"
    verification:
      - kind: manual_procedural
        ref: "grep -c 'ACK-04-01' 04-VALIDATION.md prints 4; Task 3's <human-check> block is queued for the end-of-phase harvest"
        status: pass
    human_judgment: true
    rationale: "The item's existence is mechanically verifiable; its RESOLUTION is not. Only the person who made the fourteen attestations can accept that they no longer count, and this plan deliberately leaves that unanswered."

duration: 23 min
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 11: Re-establish the acceptance record on repaired bytes — Summary

**Phase 4's acceptance record is now bound to the eleven bytes that actually ship, and it carries zero live browser evidence — seventeen checks, all pending, an unconfirmed source, and a computed `human_needed` disposition. `npm test` is green for the first time since wave 7.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-09-10T16:16:18Z
- **Completed:** 2026-09-10T16:39:26Z
- **Tasks:** 3
- **Files changed:** 14 (6 created, 8 modified)

## The headline, stated plainly

**Phase 4 now carries zero live browser evidence.** Nobody has loaded the repaired
`extension/` into Chrome. `loaded_from_repository` is `false`, `source_confirmed_on`
is `null`, every `environment` member is `null`, and all seventeen checks read
`pending`.

That is a *larger* evidence gap than the phase had this morning, and it is the
correct outcome. Fourteen of those checks were observed and personally attested by
the user on 2026-09-10 — against bytes that the `04-REVIEW.md` repairs have since
changed. **Re-observing them is a separate UAT activity and was explicitly out of
scope for this run.**

## The eleven digests this record is now bound to

| Asset | SHA-256 | Moved? |
|---|---|---|
| `background.js` | `141b192fecc263a2add910bed0bc29f3f18ec9abbcfd1c03510925235a840e6e` | **yes** (WR-04, 04-08) |
| `content.js` | `2dd1ac4c892aaadf5c4bc14b47c61e5a7aee4f9bdca42b26351b9ecd999c6c42` | **yes** (CR-01, 04-07) |
| `icons/missing.png` | `68a032b0500b1ae062a455e3b1bdbf20db8dd71c8d16dee1461e6f3dbf5e8fa0` | no |
| `icons/neutral.png` | `a13c2447cb31526e666a4e050451228480a6221efcee673a6fd30ac2d943f9d4` | no |
| `icons/off.png` | `c1289da1a9235cba4ddb0f8bcd85ca90e355ce89ddf3c24340c6409205198638` | no |
| `icons/unreadable.png` | `1131af46ac5cc421e7e951a4de067566c9a31bbfa032787f5346fb6db8e30c3a` | no |
| `icons/working.png` | `28fc0380a220982d523d39564123933db92e8d492100cd690c0dd333200845bb` | no |
| `manifest.json` | `dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5` | no |
| `popup.html` | `4c621c9d92fd21130dc2cafbf5bcaf705a98993c53eb755a53011a381729ad7c` | no |
| `popup.js` | `6a6f07c3e1dc891faf6b8f341e074d941115965f1907b8bc5a1b5b70293fa79f` | **yes** (WR-04, WR-07, 04-10) |
| `zhroma.css` | `8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0` | **yes** (CR-01, WR-08, 04-07) |

Every digest was derived from the working tree, not transcribed. `manifest.json`
being byte-identical means the permission surface is provably unmoved by the repair.

## The seventeen check ids and their statuses

**All seventeen are `pending`. None is `pass`. None is `fail`.**

| # | Check id | Status | Note |
|---|---|---|---|
| 1 | `working-icon` | pending | was attested 2026-09-10 on pre-repair bytes |
| 2 | `blank-copy` | pending | was attested 2026-09-10 on pre-repair bytes |
| 3 | `missing-icon-hint` | pending | was attested 2026-09-10 on pre-repair bytes |
| 4 | `missing-settle-transition` | pending | was attested 2026-09-10 on pre-repair bytes |
| 5 | `language-icon-copy` | pending | **never observed**; AR-04-01 waived, unchanged |
| 6 | `structure-copy` | pending | **never observed**; AR-04-01 waived, unchanged |
| 7 | `english-regional-locale` | pending | **new** — the CR-01 repair's own slot |
| 8 | `off-clears` | pending | was attested 2026-09-10 on pre-repair bytes |
| 9 | `on-restores` | pending | was attested 2026-09-10 on pre-repair bytes |
| 10 | `restart-off` | pending | was attested 2026-09-10 on pre-repair bytes |
| 11 | `restart-on` | pending | was attested 2026-09-10 on pre-repair bytes |
| 12 | `cross-tab-preference` | pending | was attested 2026-09-10 on pre-repair bytes |
| 13 | `frozen-resume` | pending | was attested 2026-09-10 on pre-repair bytes |
| 14 | `nonreceiver-status` | pending | was attested 2026-09-10 on pre-repair bytes |
| 15 | `navigation-status` | pending | was attested 2026-09-10 on pre-repair bytes |
| 16 | `worker-restart` | pending | was attested 2026-09-10 on pre-repair bytes |
| 17 | `popup-keyboard` | pending | was attested 2026-09-10 on pre-repair bytes |

The "was attested" column is provenance, not status. Those fourteen rows carry no
evidence, no date and no `language_context` in the live record — the validator's
`pending-evidence` gate makes that unrepresentable. The attestations themselves live
in `history/2026-09-10-before-review-repair/04-LIVE-ACCEPTANCE.md`, verbatim and
attributed, bound to revision `77b3a19f3f96fa99b97b47930cd44f75bc52dd57`.

## The seven timing keys and the measured worst cases

| Run key | `runtime` | Largest median | Largest max | Callbacks | Writes |
|---|---|---|---|---|---|
| `30-enabled` | loaded | **1.100 ms** | **1.800 ms** | 1900 | 18200 |
| `30-disabled` | absent | 0.000 ms | 0.000 ms | 0 | 0 |
| `200-enabled` | loaded | 4.000 ms | 5.400 ms | 1900 | 120200 |
| `200-disabled` | absent | 0.000 ms | 0.000 ms | 0 | 0 |
| `1000-enabled` | loaded | 11.200 ms | **12.200 ms** | 1900 | 600200 |
| `1000-disabled` | absent | 0.000 ms | 0.000 ms | 0 | 0 |
| `30-dormant` | **loaded** | 0.000 ms | 0.000 ms | 0 | 0 |

`timingStatus: passed`. **Worst 30-row median 1.100 ms** against the 2 ms budget;
**worst enabled batch 12.200 ms** against the 16 ms budget. 4200 measured operations
in one session, `identity.hashes` equal to the current working-tree digests,
`harnessHash` `285074ea…`.

The `30-dormant` run additionally reports **0 observers** and **0 pending timers** —
a genuinely loaded controller with a stored `false` doing genuinely nothing. That is
the shipped off state. The three `disabled` controls measure a page with no runtime
at all, which is a different program, and the `runtime` field now says so.

## The AR-04-01 addendum, in full

> ## Addendum — 2026-09-10, after the `04-REVIEW.md` repair
>
> Recorded by plan 04-11 when the acceptance record was re-established against the
> repaired bytes under `04-VALIDATION.md` promotion rule 3.
>
> **What the CR-01 repair changed about this waiver's subject.** Before the repair,
> `extension/content.js` compared `document.documentElement.lang !== 'en'` as an
> exact case-sensitive string, so every English *regional* locale — `en-GB`,
> `en-US`, `en-AU` — reached the unsupported-language branch. After the repair the
> accepted set is the English language **family**, matched case-insensitively on the
> primary subtag, in both the JavaScript and the CSS encodings. The branch's domain
> is therefore **narrower** than it was: a set of shells that used to be told their
> language is unsupported no longer are.
>
> That is a strict reduction in the false-blame surface FAIL-03 exists to prevent.
> It is not evidence for FAIL-03, and it does not shrink what this waiver covers.
>
> **What is unchanged.**
>
> - **`language-icon-copy`'s scenario and expected result are unchanged.** A
>   genuinely non-English shell still takes the unsupported-language branch and
>   still must show the question-mark artwork with "This interface language is not
>   supported". The check tests the same thing it always tested.
> - **`structure-copy` is unaffected by the repair.** The repair did not touch the
>   structure branch.
> - **Both checks remain `pending`** — now against the repaired bytes rather than
>   the pre-repair ones. Neither was observed before the repair and neither has been
>   observed since.
> - **The waiver stands.** It still permits Phase 04 to proceed to its remaining
>   independent gates, and it is still **not evidence**. FAIL-03 continues to carry
>   automated coverage on final source and zero live browser evidence.
>
> **One thing the repair does change: the value of taking the observation.** The
> unsupported-language branch is now reached by a smaller, more precisely defined
> set of shells, and the boundary between "English regional, tints" and "not
> English, refuses" is newly drawn. A live observation of either side would be worth
> more than it was before the repair, because there is now a boundary to observe
> rather than a single blanket refusal. Taking one was **out of scope for this run by
> explicit user direction**, and nothing here asks for it now.
>
> Neither check is flipped by this addendum, and nothing in it may be read as proof.

## `ACK-04-01` — outstanding, and awaiting the user rather than awaiting work

**There is no task left to run on this item. It is waiting for a person.**

`ACK-04-01` is recorded in `04-VALIDATION.md` and reads, in substance: on
2026-09-10 the user personally attested fourteen live browser observations; those
fourteen no longer count toward Phase 4 acceptance; and the user has not yet
acknowledged that.

What it asks for, precisely:

- **Acknowledgement only.** It requests no re-observation and does not ask anyone to
  open a browser.
- **Not approval.** The reset is mandated by `04-VALIDATION.md` promotion rule 3,
  `04-LIVE-ACCEPTANCE.md` rule 5 and the validator's `live-source-evidence` gate.
  Nothing here is a permission gate.
- **Disagreement is welcome and becomes a finding.** If the attester disputes any
  part of it, that is a recorded finding rather than a silent write-off — which is
  the whole reason the item exists.

**No executor may answer it.** An automated step marking it acknowledged would be
exactly the quiet write-off it exists to prevent, and would violate the ratified
`untested-is-not-consent` prohibition. It reaches the user by two routes: the
repository artifact in `04-VALIDATION.md`, and the `<human-check>` block on this
plan's Task 3, queued for the end-of-phase human-verification harvest that
consolidates into `04-UAT.md`.

## Accomplishments

- **The byte pin is green.** `npm test` reports 65 `node --test` + **574** Vitest
  across 16 files, exit 0. It had been red on
  `test/extension/phase-04-live-acceptance.test.js`'s repository-binding assertion
  since wave 7.
- **The acceptance record re-established, not re-pointed.** Recomputed digests, an
  unconfirmed source, seventeen pending checks, and a `human_needed` disposition the
  validator *computes* rather than reads.
- **Fourteen attestations preserved verbatim**, with their user attributions, dates
  and `04-UAT.md` test numbers, in a history directory with a README that says in as
  many words that these records do not validate the repaired source.
- **A seventeenth check id** giving the CR-01 repair a live-evidence slot, with a
  language-context rule that admits an `en`-primary non-`en` tag and rejects the bare
  `en`, a non-English tag, a near-miss primary subtag and a null — four negative
  cases, so the rule is pinned rather than asserted.
- **Seven timing runs on final source**, in a fresh file, with the dormant run
  measuring the shipped off state for the first time.
- **`04-05-SUMMARY.md` written**, with its provenance stated in its first paragraph
  and no live observation claimed anywhere in it.
- **`ACK-04-01` recorded outstanding**, so the reset reaches the person who attested
  the observations rather than landing silently.

## Task Commits

1. **Task 1: Preserve the pre-repair evidence, and close the 04-05 record gap** — `c694c4f` (docs)
2. **Task 2: Measure browser timing on final source, in a fresh file** — `aee0806` (perf)
3. **Task 3: Re-establish the acceptance record against the bytes that ship** — `8dec4f9` (docs)

## Files Created/Modified

- `history/2026-09-10-before-review-repair/README.md` — preservation note: HEAD `77b3a19`, eleven pre-repair digests, what the records retain, and the explicit not-validated sentence
- `history/2026-09-10-before-review-repair/04-{LIVE-ACCEPTANCE.md,PERFORMANCE-SAMPLES.json,PERFORMANCE.md,VALIDATION.md}` — byte-identical copies, verified by `shasum` against `git show HEAD:…`
- `04-05-SUMMARY.md` — the reconstructed completion record
- `04-LIVE-ACCEPTANCE.md` — rewritten narrative, seventeen-row checklist, re-established canonical record
- `04-VALIDATION.md` — this run's actual outputs, a `test:mutants` row, the promotion-rule-3 section, `ACK-04-01`
- `04-RISK-ACCEPTANCE.md` — the dated AR-04-01 addendum
- `04-PERFORMANCE.md` / `04-PERFORMANCE-SAMPLES.json` — seven runs on repaired bytes
- `test/extension/phase-04-live-acceptance.test.js` — seventeen `REQUIRED_IDS`, the extended language-context rule, four negative cases
- `.planning/ROADMAP.md` — 04-05 marked executed, plan count 9/14 → 10/14
- `.planning/WINDOWS.md` — entry 19

## Decisions Made

- **The fourteen do not carry over.** Three independent mechanisms forbid it, and
  the underlying principle is simpler than any of them: an observation is evidence
  about the bytes it was taken on.
- **`english-regional-locale` was added rather than folded into `working-icon`.**
  The repaired behaviour is specifically that an English *regional* shell tints, and
  `working-icon`'s scope is the bare `en` in the record's declared scope block. A
  behaviour with no slot is invisible; a pending slot is honest.
- **`actuals.tokens` excludes the samples JSON.** 1.4 MB of machine-generated
  measurement, present twice in the tree, would report ~1M tokens and make the
  figure useless for calibrating future estimates.
- **`independent_code_review` is now `performed-on-pre-repair-source`.** Leaving it
  `not-performed` when `04-REVIEW.md` exists would be false; calling it `passed`
  would award a gate to the agent that caused the repairs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] The `re-enable-not-pressured` ratification is qualified, not carried intact**
- **Found during:** Task 3
- **Issue:** The plan said to "keep all three `flagged_unverified` entries with `status: flagged-unverified` and their ratification dispositions intact." But `popup.js` changed under WR-04 and WR-07, so the popup the user judged when ratifying "the off switch must not pressure the agent" is not the popup that ships. Carrying that ratification forward unqualified would be the exact category error — an observation re-pointed at new bytes — that this entire plan exists to prevent, committed inside the plan that prevents it.
- **Fix:** Status and the original ratification text are both preserved unchanged. A qualification is *appended* to the `disposition` naming what changed (revert target, control operability, focus restoration), what did not (no copy added, no prompt added), and that nobody has judged the repaired failure path. Recorded again in `04-VALIDATION.md` as an additional reason the status stays `flagged-unverified`.
- **Files modified:** `04-LIVE-ACCEPTANCE.md`, `04-VALIDATION.md`, `.planning/WINDOWS.md`
- **Verification:** `flagged-unverified` count ≥ 3; the prohibition test still passes; `npm test` green
- **Committed in:** `8dec4f9`

**2. [Rule 1 - Bug] `04-PERFORMANCE.md` asserted a `setTimeout` count that the repaired bytes falsify**
- **Found during:** Task 2
- **Issue:** The document stated "`setTimeout` call sites — exactly **two**". The WR-04 repairs added a bounded deadline to `background.js` and another to `popup.js`, making four. A rewrite that carried that line forward would have shipped a false source-level claim inside an evidence document.
- **Fix:** Re-ran every grep in that section against the repaired bytes. The count is now reported as four, with a table naming each site, its purpose and its cancellation path, and an explicit note that the pre-repair document said two. The other seven grep properties re-verified as unchanged.
- **Files modified:** `04-PERFORMANCE.md`
- **Verification:** `grep -n setTimeout extension/*.js` returns exactly the four documented sites; `30-dormant` measures `pendingTimers: 0` as the runtime counterpart
- **Committed in:** `aee0806`

**3. [Rule 3 - Blocking] The validator's own fixtures had to move with `REQUIRED_IDS`**
- **Found during:** Task 3
- **Issue:** Adding a seventeenth id broke two things inside the same file: the `example()` helper produced a `complete` record whose new check carried `language_context: null`, which the new rule rejects; and `expect(pending.checks).toHaveLength(16)` was arithmetically false.
- **Fix:** `example()` now supplies `en-GB` for `english-regional-locale`, and the length assertion and its test name read seventeen. Four negative `test.each` cases added so the new rule is *proven* rather than merely present. `SCOPE`, `PROHIBITION_IDS`, `PROHIBITION_STATUSES`, `TIMING_KEYS`, `TIMING_ASSETS` and every other `requireEvidence` code were left untouched, as the plan's threat model T-04G-18 requires.
- **Files modified:** `test/extension/phase-04-live-acceptance.test.js`
- **Verification:** 42 tests passed (was 38); `npm test` 574 passed
- **Committed in:** `8dec4f9`

**4. [Rule 2 - Missing Critical] `independent_code_review: not-performed` contradicted the existence of `04-REVIEW.md`**
- **Found during:** Task 3
- **Issue:** The gate inventory still read `not-performed` for a review that has been performed and whose findings are the reason this plan exists.
- **Fix:** Changed to `performed-on-pre-repair-source`, with a note that the repairs themselves have not been independently re-reviewed, so the gate is still not `passed` and is still not self-awardable.
- **Files modified:** `04-VALIDATION.md`
- **Verification:** Read-through; the value is neither `not-performed` nor `passed`
- **Committed in:** `8dec4f9`

---

**Total deviations:** 4 auto-fixed (2 missing-critical, 1 bug, 1 blocking)
**Impact on plan:** All four are honesty corrections in the direction the plan already points. Deviation 1 is the most consequential — it makes the plan's own principle apply to a judgment the plan told me to preserve unchanged. No scope creep; no shipped byte was touched by this plan.

## Issues Encountered

**`gsd-tools windows append` is broken for this project and remains so.** It
validates the whole ledger before appending and rejects pre-existing entry 12 with
`Error: Ledger entry 11 has invalid kind: "accepted-risk"`. Entry 19 was therefore
appended **by hand** — markdown table row, JSON object, and the `open_count` /
`total_count` / `last_updated` frontmatter counters — and the JSON block was
re-parsed afterwards to confirm it is still valid (19 entries, 14 open). No earlier
entry was rewritten.

**Pre-existing ledger bookkeeping drift was deliberately left alone**, as the three
prior executors also left it: entry 11's markdown status reads `open` while
`04-UAT.md` records it closed as fixed, and the `fixed_count` / `waived_count`
counters disagree with the row statuses. Repairing that is a separate job and would
have meant editing entries this plan has no business touching.

## Known Stubs

None. No stub, placeholder or unwired data path was introduced.

Not stubs, but recorded so they are not mistaken for completeness:

- **Seventeen pending live checks.** Phase 4 has automated coverage on final source
  and zero live browser evidence. This is a real, disclosed evidence gap and the
  honest price of repairing a shipped defect.
- **Three prohibition judgments remain `flagged-unverified`** by deliberate design.
- **`ACK-04-01` is outstanding** and no automated step may close it.
- **Layout and retainer attribution remain `not-taken`**; manual profiling remains
  deferred; subjective responsiveness remains `pending-human`.

## Threat Flags

None. This plan changed no file under `extension/`, so no network endpoint, auth
path, file-access pattern or trust-boundary schema was added or altered. The
`manifest.json` digest is byte-identical to its pre-repair value.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **`npm test` is green**, so 04-12, 04-13 and 04-14 start from a clean tree. All
  three are test-only and touch nothing under `extension/`, so the binding
  established here stays valid through them.
- **`npm run test:mutants` reports 10/10 killed**, satisfying the precondition
  04-12 through 04-14 each declare.
- **Phase 4 cannot be marked accepted.** It carries zero live browser evidence, a
  `human_needed` disposition, an outstanding `ACK-04-01`, three unresolved
  prohibition judgments, seven unresolved edge assumptions, and three gates still
  unawarded (`security_asvs_level1`, `goal_verification`, and an independent review
  of the repairs themselves).
- **Do not restart UAT on the strength of this plan.** Re-observation is a separate
  activity, and the user's standing direction to skip UAT has not been withdrawn.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Completed: 2026-09-10*
