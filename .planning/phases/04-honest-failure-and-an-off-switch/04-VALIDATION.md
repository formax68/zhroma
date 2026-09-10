---
phase: 04-honest-failure-and-an-off-switch
plan: "11"
technical_tests: passed
browser_timing: passed
independent_code_review: performed-on-pre-repair-source
security_asvs_level1: not-performed
goal_verification: not-performed
human_acceptance: human_needed
overall: human_needed
---

# Phase 04 Validation Inventory

**The overall verdict is `human_needed`, and a green suite is not permitted to
change that.** The gates below are separate verdicts. Preparation tests passing is
evidence about the tests.

> Timing rows were filled by 04-05 Task 2 after the six runs actually executed.
> Task 1 committed this document with them recorded as `not-yet-run` rather than
> assumed; the history of this file shows that ordering.
>
> **Re-measured by 04-11 on 2026-09-10.** The `04-REVIEW.md` repairs moved four of
> the eleven shipped assets, so every figure in the results table below was taken
> again on the repaired bytes. The pre-repair version of this document is preserved
> at `history/2026-09-10-before-review-repair/04-VALIDATION.md`.

## Gate inventory — verdicts kept apart

| Gate | Verdict | Who can supply it | Notes |
|---|---|---|---|
| **Automated technical tests** | `passed` | This plan | 65 `node --test` + 574 Vitest across 16 files, exit 0, on the repaired bytes. See results below. |
| **Mutation gate** | `passed` | This plan | `npm run test:mutants` — 10/10 registered mutants killed, each by a named behavioural test. A gate on the tests, not on the product. |
| **Browser timing (synthetic)** | `passed` | This plan | Finite measurement only — 4200 samples inside the inherited budget. **Layout and retainer attribution were not taken**, and felt responsiveness stays `pending-human`. See `04-PERFORMANCE.md`. |
| **Independent code review** | `performed-on-pre-repair-source` | A reviewer other than the implementing agent | Executed once: `04-REVIEW.md`, one critical (CR-01) and ten warnings, against the pre-repair source. Its findings are what moved the bytes. **The repairs themselves have not been independently reviewed**, so this gate is not `passed` and is not self-awardable. |
| **Security — ASVS level 1, high/critical blocking** | `not-performed` | Independent security review | This plan prepares its evidence; it does not issue the verdict. |
| **Phase goal verification** | `not-performed` | `/gsd-verify-work` | Separate from both review and human acceptance. |
| **Human acceptance (browser)** | `human_needed` | The user | **Seventeen** pending observations in `04-LIVE-ACCEPTANCE.md`, and an unconfirmed source. Phase 4 currently carries **zero** live browser evidence. |

**Promotion rules, enforced by `test/extension/phase-04-live-acceptance.test.js`:**

1. Any check that is `pending` or `fail` blocks a human-`passed` disposition.
2. Any unresolved entry in `flagged_unverified` blocks a `passed` disposition.
3. Any change to any of the eleven shipped assets invalidates the binding and
   therefore invalidates promotion — the record must be re-established against
   the new bytes, not re-pointed at them.
4. Absent timing samples make the record incomplete (`human_needed`); failed
   timing samples make it a defect (`gaps_found`).

These four rules are the contract 04-11 obeyed. They are carried here verbatim and
were **not** edited by the re-establishment they mandated.

## Re-establishment under promotion rule 3 — 2026-09-10

Repairing the `04-REVIEW.md` findings changed **four of the eleven shipped
assets**, which under rule 3 invalidated the binding the acceptance record was
built on:

| Asset | Pre-repair digest | Current digest | Findings that moved it | Plans |
|---|---|---|---|---|
| `content.js` | `1c1e0b03…` | `2dd1ac4c…` | CR-01 | 04-07 |
| `zhroma.css` | `f5af3870…` | `8eb5da85…` | CR-01, WR-08 | 04-07 |
| `background.js` | `ab871ca8…` | `141b192f…` | WR-04 (and WR-03, WR-10 in its tests) | 04-08 |
| `popup.js` | `0f87b1a6…` | `6a6f07c3…` | WR-04, WR-07 | 04-10 |

`manifest.json`, `popup.html` and all five PNGs are byte-identical, so the
permission surface and the packaged icon set are provably unmoved.

The record was therefore **re-established, not re-pointed**: `source.assets`
recomputed from the working tree, `loaded_from_repository` set to `false` with a
null `source_confirmed_on` and a null `environment`, and every check reset to
`pending`. One check id was added — `english-regional-locale` — because the CR-01
repair ships a behaviour (an English regional locale tints instead of being told
its language is unsupported) that no existing check covered. Seventeen checks,
zero observed.

`04-VALIDATION.md`, `04-LIVE-ACCEPTANCE.md`, `04-PERFORMANCE.md` and
`04-PERFORMANCE-SAMPLES.json` as they stood before this are preserved verbatim at
`history/2026-09-10-before-review-repair/`, together with a README recording the
pre-repair HEAD `77b3a19f3f96fa99b97b47930cd44f75bc52dd57` and all eleven
pre-repair digests.

### Outstanding — `ACK-04-01`

**Id:** `ACK-04-01`
**Status:** **outstanding** — awaiting the user, not awaiting work
**Raised:** 2026-09-10 by plan 04-11
**Route:** the `<human-check>` block on 04-11 Task 3, queued for the end-of-phase
human-verification harvest, which consolidates it into `04-UAT.md`

On 2026-09-10 the user personally attested **fourteen** live browser observations
at the Phase 4 blocking checkpoint. Those fourteen **no longer count toward Phase 4
acceptance.** They were taken on the pre-repair bytes; four of those bytes have
changed; and promotion rule 3, `04-LIVE-ACCEPTANCE.md` rule 5 and the validator's
`live-source-evidence` gate each independently forbid carrying them onto the
repaired bytes. They are preserved verbatim, attributed and dated, in the history
directory.

**The user has not yet acknowledged this.** That is what is outstanding. Concretely:

- The reset itself is **not** a permission gate. It is mandated by three mechanisms
  and would be wrong to do differently, so nothing here asks for approval.
- What is asked for is **acknowledgement**: that the fourteen attestations are now
  dated history, that Phase 4 consequently closes carrying **zero** live browser
  evidence and a `human_needed` disposition, and that re-observing them is a
  separate UAT activity.
- It requests **no re-observation**. Nothing about this item asks the user to open
  a browser.
- If the user disagrees with any of it, that disagreement becomes a finding rather
  than a silent write-off — which is the entire purpose of recording it.

**No executor may answer this item.** An automated step marking `ACK-04-01`
acknowledged would be precisely the quiet write-off of user-supplied evidence it
exists to prevent, and it would violate the ratified `untested-is-not-consent`
prohibition. It stays outstanding until the person who made the attestations
responds.

## Automated results on the final Phase 4 source

Executed against the current eleven-asset inventory (`04-LIVE-ACCEPTANCE.md`
`source.assets`), **as re-measured by 04-11 on the repaired bytes**. Every figure
below is the actual output of the command, run in that plan.

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js` | **42 passed**, exit 0. Prints `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed`. Up from 38: the seventeen-check validator adds four negative cases pinning the new `english-regional-locale` language-context rule. |
| `npm test` (recon smoke + full Vitest) | **65** `node --test` + **574** Vitest passed across 16 files, exit **0**. **This is the run that closes the byte pin**, which had been red since wave 7. |
| `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon` | **65** + **574 passed** across 16 files, exit 0. |
| `npm run test:mutants` | **10/10 killed**, exit 0. Six mutants from 04-08 (WR-03, WR-04, T-04G-05) and four from 04-10 (WR-04, WR-07). Each kill names the behavioural test that caught it. A mutant is registered only after it has been *measured* killed. |
| `node scripts/run-tint-workload.js --size 30 --mode enabled --smoke` | `TINT WORKLOAD SMOKE: passed`, exit 0; identity hashes match the repaired source. |
| `node scripts/run-tint-workload.js --size {30,200,1000} --mode {enabled,disabled} --output …/04-PERFORMANCE-SAMPLES.json` | All six runs `TINT WORKLOAD: passed`, exit 0. 3600 measured operations (6 × 6 × 100 after 10 warmups). Worst 30-row median **1.100 ms** (budget 2 ms); worst enabled batch **12.200 ms** (budget 16 ms); all three disabled controls **0 callbacks / 0 writes**, `runtime: absent`. |
| `node scripts/run-tint-workload.js --size 30 --mode dormant --output …/04-PERFORMANCE-SAMPLES.json` | `TINT WORKLOAD: passed`, exit 0. Report `timingStatus: passed` with **seven** run keys. The dormant run reports `runtime: loaded`, **0 callbacks**, **0 writes**, **0 observers** and **0 pending timers** across all six families — the shipped off state, measured, as distinct from the no-runtime baseline. |
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-03-live-acceptance.test.js` | **30 passed**; prints `PHASE 03 LIVE ACCEPTANCE STATUS: human_needed`. File untouched by 04-05 and by 04-11, and still bound to `382cc88`. |

A fresh output file was **mandatory**, not preferred: 04-09 changed
`identity.harnessHash` (`f889a9eb…` → `285074ea…`) and 04-07 changed two of the
three hashed assets, so `mergeReport`'s identity-equality guard refused every run
against the old file. That refusal is the guard working. The old samples were
preserved to history before the live file was removed, and `WINDOWS.md` entry 15
recorded the unmergeable state in advance.

### What the automated suite does and does not establish

It establishes, against the actual shipped bytes: the diagnosis taxonomy and its
D-01 certainty gate; the finite `{diagnosis, reason}` protocol and its sender
guards; a single serialized boolean writer with `saved`/`enabled`/`applied`
reported separately; dormancy on an unconfirmed, rejected, throwing, `false` or
non-boolean preference; the persistent-off/lifecycle-pause separation in both
directions; per-tab toolbar projection with generation and request-id ordering;
five byte-distinct 32×32 RGBA PNGs and the worker's exact projection set; the
frozen permission surface, match pattern, `world: "ISOLATED"` and
`all_frames: false`; and the absence of colour literals, CSS writes, DOM
construction, network, console and web-storage use in every shipped script.

It also establishes, since the repair: that the JavaScript and CSS encodings of
the accepted English language family admit and refuse exactly the same set of
shell tags, over a fixed locale matrix, so no shipped state exists where the popup
says working and nothing paints; that all four tint declarations carry
`!important`; that both worker hops and both popup hops are bounded, with the
popup's deadline strictly exceeding the worker's, asserted from the shipped bytes;
and that after a failed save the switch reverts to the last value storage actually
confirmed and stays operable with focus restored.

Timing establishes, on final source: that the controller stays inside the
inherited Phase 3 budget at 30, 200 and 1000 rows; that mutation filtering costs
~0 ms and zero timer passes for an irrelevant change even at 1000 rows; that the
`disabled` control loads no runtime at all; and — separately, and this is the
distinction 04-09 added — that the **shipped off state** with a stored `false` and
a genuinely loaded controller produces zero callbacks, zero writes, zero observers
and zero pending timers. Those are two different programs and the `runtime` field
now says which is which. It does **not** establish attributed forced layouts or
attributed detached retention — **no `--profile` run was taken in this plan**, so those are recorded
as *not-taken*, never as zero. Phase 3's manual profiling stays deferred at the
user's request and its own `human_needed` attribution disposition stands
unchanged; aggregate counters were not substituted for it.

It does **not** establish anything a person has to see: that the artwork is
distinguishable at 16 px, that tint visibly disappears on click, that a genuine
browser restart rehydrates the key, that the copy reads as honest rather than
alarming, or that a real Zendesk view behaves as the fixtures do. Simulated
Chrome delivery is a model of Chrome, not Chrome.

## Requirement coverage — offline covered, none accepted

Seven requirements. Every one has automated coverage on final source and every
one also has at least one pending live check — **and after the 2026-09-10
re-establishment, every live check in this table is pending.** None is accepted;
none should read `Complete` while Phase 4 carries zero live browser evidence.

| Requirement | Automated coverage on final source | Live checks that must still be observed | Status |
|---|---|---|---|
| **FAIL-01** — three distinct diagnoses | `toolbar-popup.test.js` (four/five icons byte-distinct; two tabs hold different states; off projects its own shape); `diagnosis.test.js` (working/blank); `runtime-contract.test.js` (every packaged icon 32×32 RGBA; worker projects no other artwork) | `working-icon`, `blank-copy`, `missing-icon-hint`, `navigation-status`, `english-regional-locale` | pending-human |
| **FAIL-02** — hint only on a certain missing column | `diagnosis.test.js` (99/100 ms boundary; restart-on-change; same-turn withdrawal; eleven not-missing shapes stay neutral); `#the <missing/structure/waiting> diagnosis writes no diagnostic markup into the page` | `missing-icon-hint`, `missing-settle-transition` | pending-human |
| **FAIL-03** — unsupported locale never claims missing | `diagnosis.test.js` (non-English shell → `cannot-read`/`unsupported-language`; absent/whitespace `lang` → generic `structure`; no language string on the wire); `toolbar-popup.test.js` (a broken English view is never blamed on its language); `runtime-contract.test.js` (the JS and CSS language predicates accept exactly the same shells); `initial-tint.test.js` / `persistent-tint.test.js` (five English regional locales tint; `fr`, `fr-CA`, `eng`, `ende`, empty and whitespace are refused with zero writes) | `language-icon-copy`, `structure-copy`, `english-regional-locale` | pending-human |
| **FAIL-05** — toolbar icon exposes the diagnosis | `toolbar-popup.test.js` (per-tab writes on every path; recreated worker rebuilds from a handshake; a closed tab cannot be painted by an in-flight reply); `runtime-contract.test.js` (packaged icon inventory) | `working-icon`, `missing-icon-hint`, `navigation-status`, `worker-restart` | pending-human |
| **CTRL-02** — popup off/on | `toggle.test.js` (one labelled default-on switch; off clears with no reload; on restores current priorities; repeat input refused with focus preserved); `toolbar-popup.test.js` (default focus and accessible name) | `off-clears`, `on-restores`, `popup-keyboard` | pending-human |
| **CTRL-03** — default-on boolean survives restart | `toggle.test.js` (one key round-trips both states across a simulated restart; a stale startup read cannot re-enable; popup reconstructs from storage); `toolbar-popup.test.js` (a recreated worker serves the persisted value) | `restart-off`, `restart-on`, `cross-tab-preference`, `frozen-resume`, `worker-restart` | pending-human |
| **CTRL-04** — current tint removed without refresh | `toggle.test.js` (rejected write, rejected read-back and permanent removal fault each reported honestly; no-receiver reports the connection); `toolbar-popup.test.js` (a transient cleanup failure still reaches the intended state) | `off-clears`, `on-restores`, `nonreceiver-status` | pending-human |

A **simulated** browser restart is context recreation in a VM. It is not a
browser restart, and `restart-off` / `restart-on` exist precisely because the
distinction is the whole claim.

## Prohibition judgments — three, all unresolved

Carried verbatim from `04-05-PLAN.md` `must_haves.prohibitions`, which took them
from `projectProhibitions` with **no fabricated `check_kind`, `check_target`,
`check_rule` or fixtures**. They are `flagged-unverified` in the canonical
record and they block a `passed` disposition.

| id | Statement | Status | Why automation cannot close it |
|---|---|---|---|
| `no-agent-blame` | The diagnosis must not blame an agent or imply they caused an unsupported or malformed view. | **flagged-unverified** | Tests prove the copy is finite, fixed and branched on actual evidence. Whether "Add a Priority column to this view to use tinting" reads as help or as accusation is a judgment about a reader. |
| `re-enable-not-pressured` | The off switch must not pressure the agent to re-enable tinting or imply that off is an error. | **flagged-unverified** | Tests prove off has its own packaged artwork, its own copy, and no accompanying hint. Absence of felt pressure is not a machine-checkable property. |
| `untested-is-not-consent` | Untested browser behavior must not be presented as observed acceptance or consent. | **flagged-unverified** | The validator enforces the mechanical half — pending cannot compute to passed. The remaining half is how this record is read and reported, which no run can certify. |

These are **not** accepted risk. They need an explicit human or independent
reviewer disposition before ship.

## Unclassified edge assumptions — seven, all unresolved

From `04-SOURCE-AUDIT.md` ("Spec-less edge coverage"): the edge engine returned
`applicable=7, resolved=0, unresolved=7`. **The existence of a plan or a passing
test does not resolve a probe classification**, and none is marked resolved here.

| Requirement | Flagged assumption | Where it is investigated | Status |
|---|---|---|---|
| FAIL-01 | Three-state product semantics need actual behavioural and visual verification | 04-03; 04-05 Task 3 | unresolved |
| FAIL-02 | Certainty may be undermined by real mount timing | 04-03/1; 04-05 Tasks 1 & 3 | unresolved |
| FAIL-03 | Unsupported/missing language presentation needs evidence | 04-03/1; 04-05 Tasks 1 & 3 | unresolved |
| FAIL-05 | Distinct artwork must be recognizable in browser | 04-01/1, 04-03/2; 04-05 Tasks 1 & 3 | unresolved |
| CTRL-02 | Popup interaction must reflect authoritative intent | 04-04; 04-05 | unresolved |
| CTRL-03 | Real browser restart is not established by context recreation | 04-04/2; 04-05 Tasks 1 & 3 | unresolved |
| CTRL-04 | Real visual cleanup cannot be established only by marker checks | 04-04/1; 04-05 Tasks 1 & 3 | unresolved |

## Inherited evidence that this plan did not move

- **Phase 3 is `human_needed`** at 28/34 truths, with eleven source-bound live
  passes and **nine untested live checks** after the user's explicit UAT skip.
  LIVE-05 and FAIL-04 still lack human evidence; manual profiling remains
  deferred. `03-LIVE-ACCEPTANCE.md`, `03-PERFORMANCE*.md` and
  `test/extension/phase-03-live-acceptance.test.js` were **not touched** by this
  plan, and the Phase 3 test still reports `human_needed` bound to `382cc88`.
  Phase 4 work proceeds from `03-HANDOFF.md`'s verified source baseline, which
  explicitly does **not** authorize claiming the dependency accepted.
- **AR-01-13** remains historical, not-attested risk acceptance. Never rewritten
  as proof.
- **T-04-16**, permanent native marker-removal failure, remains a disclosed
  platform limit. It is honoured by reporting `applied: false` and the honest
  "Setting saved, but this view did not update" line, not waived.
- **`WINDOWS.md`** carries the Phase 01 deviations (ids 1–6), the Phase 02
  unrun-verify (id 7, eleven pending live observations), the Phase 04 copy-set
  deviation (id 11, ratified by the user at the 2026-09-10 checkpoint), the
  FAIL-03 accepted risk (id 12, AR-04-01), and the wave 7–9 gap-closure
  deviations (ids 14–19). Entries 8–10 were closed by 04-06. The
  re-establishment closed none of the open entries and marks none of them fixed;
  it added one (id 19, this plan's own qualification of the
  `re-enable-not-pressured` ratification).
- **`WINDOWS.md` entry 11 was ratified by the user, not by an executor.**
  04-04 added two operational copy strings — "Zhroma could not save that
  setting" and "Setting saved, but this view did not update" — beyond the 04-01
  decided set, because the plan mandates finite honest failure text and the
  decided set contained none for a failure of Zhroma's own action. Both are
  statements about Zhroma, never a diagnosis about the view, so the three
  product diagnoses stay three. The copy set was a **user decision**, and the
  user ratified this addition at the Phase 4 checkpoint (`04-UAT.md` test 21).
  Neither string was touched by the repair, so that ratification is still about
  the words that ship.
- **The `re-enable-not-pressured` ratification is qualified, and deliberately not
  promoted.** The user judged the off state on the pre-repair popup. `popup.js`
  then changed under WR-04 and WR-07. The repair added no copy and no prompt — it
  changed the revert target after a failed save, kept the control operable and
  restored focus — but whether the repaired failure path *still* reads as
  unpressured is a judgment nobody has made against the new bytes. The
  qualification is recorded in the judgment's own `disposition` text in
  `04-LIVE-ACCEPTANCE.md`, and it is an additional reason the status field stays
  `flagged-unverified`.

## Handoff facts for the store listing and for review

- **Chrome 106 compatibility floor.** `minimum_chrome_version: "106"` exists
  because `sender.documentId` is load-bearing for content-script identity at the
  worker's trust boundary. Lowering it would remove the worker's ability to tell
  two documents in the same tab apart. It is a security decision, not a
  convenience, and it deliberately excludes installs below Chrome 106.
- **`storage.local`, exactly one boolean, no `sync`.** `{enabled: boolean}` in
  `chrome.storage.local`, written by the worker alone; an absent key means
  `true`, preserving zero-configuration install. `chrome.storage.sync`,
  `session` and `managed` are pinned absent by name. Two consequences the product
  must not overstate: the preference does **not** follow the agent to another
  machine, and cross-tab delivery is **asynchronous** — a frozen tab converges on
  resume rather than atomically. The `global-local` decision states that limit
  explicitly.

## Silent-regression hazard to carry into review

`requestApply` in `extension/background.js` must key its staleness guard on its
**echoed `requestId`**, not on the per-tab projection generation. Applying a
preference makes the document publish a new status, whose `status-invalidated`
hint increments that generation — so a generation guard there discards a true
reply about work that just completed, and the popup reports "No readable view is
connected" immediately after re-enabling even though the tint visibly returned.
Painting stays generation-guarded inside `project()`. This was a real defect
found and fixed in 04-04; if a future change re-adds a generation guard to
`requestApply`, the bug returns **silently**, because both properties look
correct in isolation. `#switching back on restores tint for priorities that
changed while it was off` and `#a slow earlier reply cannot repaint over a newer
projection` must both keep passing.

---

*Phase: 04-honest-failure-and-an-off-switch*
*Plan: 04-11 — re-established on repaired bytes under promotion rule 3; human acceptance outstanding, and `ACK-04-01` outstanding with it*
