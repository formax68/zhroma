---
phase: 04-honest-failure-and-an-off-switch
plan: "05"
technical_tests: passed
browser_timing: passed
independent_code_review: not-performed
security_asvs_level1: not-performed
goal_verification: not-performed
human_acceptance: human_needed
overall: human_needed
---

# Phase 04 Validation Inventory

**The overall verdict is `human_needed`, and a green suite is not permitted to
change that.** The five gates below are five separate verdicts. Only the first
has been executed by this plan. Preparation tests passing is evidence about the
tests.

> Timing rows were filled by 04-05 Task 2 after the six runs actually executed.
> Task 1 committed this document with them recorded as `not-yet-run` rather than
> assumed; the history of this file shows that ordering.

## Gate inventory — five verdicts, kept apart

| Gate | Verdict | Who can supply it | Notes |
|---|---|---|---|
| **Automated technical tests** | `passed` | This plan | 65 `node --test` + 518 Vitest, exit 0. See results below. |
| **Browser timing (synthetic)** | `passed` | This plan | Finite measurement only — 3600 samples inside the inherited budget. **Layout and retainer attribution were not taken**, and felt responsiveness stays `pending-human`. See `04-PERFORMANCE.md`. |
| **Independent code review** | `not-performed` | A reviewer other than the implementing agent | Must run against the final Phase 4 source. Not self-awardable. |
| **Security — ASVS level 1, high/critical blocking** | `not-performed` | Independent security review | This plan prepares its evidence; it does not issue the verdict. |
| **Phase goal verification** | `not-performed` | `/gsd-verify-work` | Separate from both review and human acceptance. |
| **Human acceptance (browser)** | `human_needed` | The user, at 04-05 Task 3 | Sixteen pending observations in `04-LIVE-ACCEPTANCE.md`. |

**Promotion rules, enforced by `test/extension/phase-04-live-acceptance.test.js`:**

1. Any check that is `pending` or `fail` blocks a human-`passed` disposition.
2. Any unresolved entry in `flagged_unverified` blocks a `passed` disposition.
3. Any change to any of the eleven shipped assets invalidates the binding and
   therefore invalidates promotion — the record must be re-established against
   the new bytes, not re-pointed at them.
4. Absent timing samples make the record incomplete (`human_needed`); failed
   timing samples make it a defect (`gaps_found`).

## Automated results on the final Phase 4 source

Executed against the current eleven-asset inventory (`04-LIVE-ACCEPTANCE.md`
`source.assets`). Every figure below is the actual output of the command, run in
this plan.

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-04-live-acceptance.test.js` | **38 passed**, exit 0. Prints `PHASE 04 LIVE ACCEPTANCE STATUS: human_needed`. |
| `npm test` (recon smoke + full Vitest) | **65** `node --test` + **518** Vitest passed across 14 files, exit **0**. |
| `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon` | **65** + **518 passed** across 14 files, exit 0. |
| `node scripts/run-tint-workload.js --size 30 --mode enabled --smoke` | `TINT WORKLOAD SMOKE: passed`, exit 0; identity hashes match current source. |
| `node scripts/run-tint-workload.js --size {30,200,1000} --mode {enabled,disabled} --output …/04-PERFORMANCE-SAMPLES.json` | All six runs `TINT WORKLOAD: passed`, exit 0. Report `timingStatus: passed`. 3600 measured operations (6 × 6 × 100 after 10 warmups). Worst 30-row median **1.300 ms** (budget 2 ms); worst enabled batch **13.900 ms** (budget 16 ms); all three disabled controls **0 callbacks / 0 writes**. |
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/phase-03-live-acceptance.test.js` | **30 passed**; prints `PHASE 03 LIVE ACCEPTANCE STATUS: human_needed`. File untouched by this plan and still bound to `382cc88`. |

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

Timing establishes, on final source: that the controller stays inside the
inherited Phase 3 budget at 30, 200 and 1000 rows; that mutation filtering costs
~0 ms and zero timer passes for an irrelevant change even at 1000 rows; and that
disabled mode genuinely loads no runtime rather than loading one that declines to
act. It does **not** establish attributed forced layouts or attributed detached
retention — **no `--profile` run was taken in this plan**, so those are recorded
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
one also has at least one pending live check. **None is accepted; none should
read `Complete` before Task 3's observations exist.**

| Requirement | Automated coverage on final source | Live checks that must still be observed | Status |
|---|---|---|---|
| **FAIL-01** — three distinct diagnoses | `toolbar-popup.test.js` (four/five icons byte-distinct; two tabs hold different states; off projects its own shape); `diagnosis.test.js` (working/blank); `runtime-contract.test.js` (every packaged icon 32×32 RGBA; worker projects no other artwork) | `working-icon`, `blank-copy`, `missing-icon-hint`, `navigation-status` | pending-human |
| **FAIL-02** — hint only on a certain missing column | `diagnosis.test.js` (99/100 ms boundary; restart-on-change; same-turn withdrawal; eleven not-missing shapes stay neutral); `#the <missing/structure/waiting> diagnosis writes no diagnostic markup into the page` | `missing-icon-hint`, `missing-settle-transition` | pending-human |
| **FAIL-03** — unsupported locale never claims missing | `diagnosis.test.js` (non-English shell → `cannot-read`/`unsupported-language`; absent/whitespace `lang` → generic `structure`; no language string on the wire); `toolbar-popup.test.js` (a broken English view is never blamed on its language) | `language-icon-copy`, `structure-copy` | pending-human |
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
- **`WINDOWS.md`: 8 open entries.** Six Phase 01 deviations (ids 1–6), one Phase
  02 unrun-verify (id 7, eleven pending live observations) and **id 11**, the
  Phase 04 copy-set deviation. Entries 8–10 were closed by 04-06. This plan
  closed none of them and marks none of them fixed.
- **`WINDOWS.md` entry 11 needs user ratification, not executor ratification.**
  04-04 added two operational copy strings — "Zhroma could not save that
  setting" and "Setting saved, but this view did not update" — beyond the 04-01
  decided set, because the plan mandates finite honest failure text and the
  decided set contained none for a failure of Zhroma's own action. Both are
  statements about Zhroma, never a diagnosis about the view, so the three
  product diagnoses stay three. The copy set was a **user decision**; this
  addition is surfaced at the Phase 4 checkpoint for the user to ratify or
  reject. It is not ratified here.

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
*Plan: 04-05 — preparation only; human acceptance outstanding*
