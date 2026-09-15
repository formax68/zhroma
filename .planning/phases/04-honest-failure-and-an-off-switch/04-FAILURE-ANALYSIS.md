# Phase 4 repeated-gap analysis

Investigated 2026-09-11 against `0cc45c38f8fc1c38cfa2a522890385d21a66de64`.
Purpose: inform append-only gap plans 04-15 onward. This is planning evidence,
not implementation, acceptance, or an independent security verdict.

## Finding

The repeated rounds are not simply finding more unusual inputs. The earlier
plans prescribed local repairs without a complete outcome model, and their
tests sometimes adopted the prescribed implementation as the expected answer.
The resulting green checks could certify the repair while missing its effect
on the rest of the user operation. Evidence was then rebound before the final
independent review, causing avoidable live-acceptance rework.

No plan can guarantee zero future defects. This round must instead have a
finite, auditable closure contract: every current finding dispositioned, every
failure family exercised by a discriminating observation, and review of the
integrated final source before renewed human acceptance.

## Evidence collected in this run

| Probe | Observation | Meaning |
|---|---|---|
| Actual shipped worker/content/popup through `tracer-world.js`; stored true; open popup; reject subsequent reads; request false | stored=false, checked=true, disabled=false, copy=`Zhroma could not save that setting`, markers=[] | The write succeeded and the switch reports the opposite. |
| Same probe starting stored=false; request true | stored=true, checked=false, disabled=false, same failed-save copy | CR-01 is bidirectional. A test of OFF alone is insufficient. |
| Actual worker; reads deferred forever; two opposing requests; `portCloseMs: 10000`; observe at 5500 ms | no replies; write log only `[{enabled:false}]`; stored=false | The first read blocks the serialized operation and prevents the second write. |
| `node node_modules/vitest/vitest.mjs run --config vitest.config.js test/extension/toggle.test.js test/extension/runtime-contract.test.js` | 2 files, 38 tests passed, exit 0 | Current assertions do not reject the reproduced defect. This was a targeted baseline, not a fresh full-suite certification. |
| Exact current mutation runner copied to a disposable minimal repository; valid find/replace, deliberately nonexistent suite | `missing-suite-control: killed (exit 1)`; `MUTATION KILLS: 1/1 killed`; runner exit 0 | The gate can declare a kill when no test executed. Temporary files removed; repository sources untouched. |
| Current `.planning/REQUIREMENTS.md` and history | all seven Phase 4 boxes unchecked; five `Gaps Found`, two `Pending`; correction commit `39bcfcc` | The requirement-status finding is already repaired. Preserve it and prevent recurrence; do not duplicate the correction. |

The first stalled-read probe used the harness default 500 ms port close and
therefore obtained undefined channel-close results. That does **not** prove the
worker replied. The corrected probe above deliberately outlives the observation
window. This is itself an example of why a test double's fallback cannot be the
oracle for the production deadline.

## Causal chain and planning changes

| Failure pattern | Source-bound evidence | Required change to this plan round |
|---|---|---|
| A mechanism replaced an outcome contract | `04-10-PLAN.md` Task 1 commands `showPreference(null)` to restore `lastConfirmed`; current `popup.js` calls it for successful writes with failed read-back as well as failed writes. `toggle.test.js` asserts checked=true without inspecting storage. | Write the save/read/apply/connection outcome table first, in both directions. Check persisted value, control position/uncertainty, copy, marker effect, and retry together. Fresh read-back and successful write acknowledgement are different evidence from an absent reply. |
| A local bound was described as operation-wide recovery | `04-08` bounds document messages; current `setEnabled` still awaits storage write, storage read, and active-tab query unbounded inside one queue. `popup-recovery` compares 5000>2000 rather than complete request latency. | Inventory every await and queue admission on popup-status, set-enabled, and projection. Give accepted requests and overload responses deadlines measured from arrival; no finite timeout covers an unbounded backlog. Prove late completions cannot overwrite newer UI or reorder writes. |
| A suggested repair can create the next regression | Review WR-02 suggests wrapping storage writes in `bounded(...).then(Boolean)`. Current helper resolves null on timeout; it does not cancel its input promise or Chrome's operation. | Do not interpret timeout as write failure. Keep actual write exclusion until completion or explicitly block/reject further writes while outcome is unknown. Separate response deadline from side-effect lifetime. Test commit-before-callback, callback-after-deadline, a second opposite request, and recovery. |
| Mutation totals substituted for evidence of sensitivity | Current `runMutant` uses `result.status !== 0`; no clean-copy baseline, asserted test identity, or execution-error rejection. `npm test` never checks registry validity. | Run a green unmutated baseline; require an executed intended assertion to fail; reject missing suites, parse/import errors, spawn errors, process signals, timeouts, empty or malformed reports. Check registry integrity cheaply in the default suite. Preserve distinctions between behavioral and source-shape kills. |
| Model limitations were mistaken for platform proof | `runtime-contract.test.js` documents happy-dom selector disagreement; failed-read harness originally supplied no value; earlier delayed delivery could not construct stale replies. | State the model boundary per test. Keep precise CSS-source checks, real-source synthetic behavior, and actual browser observations distinct. Make harness controls independent for call dispatch, commit, callback, and response delivery. |
| Review numbering and completion metadata lost context | Current REVIEW replaces an older report and reuses CR/WR IDs; old plans reference those IDs. `04-11-SUMMARY.md` says all seven `requirements-completed` while its record is human_needed. ROADMAP says 14/14 and also 4 of 8 gap plans. | Qualify finding IDs by review pass/revision. Use a current coverage ledger with already-fixed, planned, residual-risk, and human-evidence dispositions. Prevent technical-summary bookkeeping from promoting acceptance. |
| Acceptance was prepared before the final integration review | 04-11 reset 14 historical observations, then 04-12–14 completed; the subsequent independent review found another shipped defect requiring another source change. | All runtime repairs and independent code/security review fixes precede final source binding and UAT. Interim stale-byte failures must be explicit; never erase history or bulk-transfer attestations. A post-binding runtime change invalidates affected final-source evidence and returns to the review/binding gate. |

## Scope completeness

The next plans must account for current review pass 2 CR-01 and WR-01 through
WR-06, not only the four entries copied into VERIFICATION frontmatter:

- CR-01: successful-write/failed-read popup contradiction.
- WR-01: malformed English shell must be structural uncertainty, not a false
  unsupported-language claim. The review's suggested `trim()` fix does not
  cover its own `en_US` example; the contract must cover every named example.
- WR-02 and WR-03: every asynchronous hop, queue admission, whole-operation
  deadline, non-cancellation, and actual retry/ordering behavior.
- WR-04 and WR-05: trustworthy mutation runner and default-suite registry gate.
- WR-06: exact shipped selector guard plus genuine browser evidence for
  language/paint agreement.
- IN-01 through IN-05: give each a reasoned disposition. Do not silently add
  unapproved packages to solve the type-checking tooling item.
- Disclosed WINDOWS limitations: revisit affected ones under the final repair,
  particularly unreachable application copy, closed-tab projection, and
  individually unobservable guards. A disclosed limit is not a demonstrated
  mitigation; do not quietly claim all limitations fixed.
- Live acceptance: retain the existing FAIL-03 waiver AR-04-01 as risk acceptance,
  not observation; the remaining current-source observations still need the
  user. Preserve Phase 3's independent `human_needed` state.

The deterministic edge probe was rerun from the seven actual requirement texts:
7 applicable, 0 resolved, 7 unresolved (`unclassified`). This classifier result
does not establish edge coverage and cannot justify ignoring the concrete
failure matrix above. Carry the seven flagged assumptions explicitly.

## Platform boundary checked

Chrome documents storage as asynchronous and documents `set` as returning a
promise that resolves on success or rejects on failure. This repository uses
the callback form. The documented method has no cancellation argument.
Consequently, treating a caller-side timeout as cancellation is unsupported;
the non-cancellation concern follows directly from the current `Promise.race`
implementation and must be tested as a late-completion case.
[Chrome storage API](https://developer.chrome.com/docs/extensions/reference/api/storage),
[StorageArea.set](https://developer.chrome.com/docs/extensions/reference/api/storage/StorageArea#method-set)

Chrome can terminate extension workers and discards their global variables.
An in-memory pending-write gate therefore must not be described as durable
cross-restart transaction isolation. The existing one-boolean/no-extra-permission
contract limits recovery guarantees; any unmet cross-epoch guarantee must stay
explicit rather than be fabricated by a worker-restart double.
[Extension worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

## Required exit evidence

1. A checked finding-to-task-to-counterexample map covering this analysis and
   the full current review, with every exclusion explained.
2. Red-before-green examples against unchanged shipped source for current
   defects; green controls and named assertion failures for every claimed kill.
3. Integrated whole-operation tests including both directions, concurrent
   popups, delayed writes/readbacks/responses, late callbacks and unknown state.
4. Independent code and security review against the final runtime inventory;
   findings repaired and rechecked before renewed live evidence is requested.
5. Final-source acceptance binding, performance evidence where affected, and
   a single coherent human walkthrough. `human_needed` and accepted residual
   risks remain distinct from technical verification.

This analysis changes no shipped behavior and does not close Phase 4.

## Independent draft review

The separate plan checker identified two additional omissions in the first
technical drafts, before implementation:

- Event-originated toolbar projections need their own finite observation
  budget. Popup admission deadlines do not cover activation, update or content
  invalidation events. An old stalled read must not prevent a later healthy
  same-tab projection from recovering.
- A restart double must retain already-issued native commits while suppressing
  callbacks, timers and further API calls from terminated worker JavaScript.
  Keeping all old callbacks alive simulates a worker that never died; deleting
  the native commit hides the late-effect hazard.

Both now have explicit requirements in 04-16. Final independent plan checking
is recorded separately in 04-GAP-PLAN-CHECK.md. Corrected plans are not evidence
that these runtime behaviors have been implemented or verified.

The whole-set review also caught a ledger/plan disagreement about fresh read-back
precedence and application-failure copy. The ledger now follows the executable
contract: fresh returned boolean first, acknowledged desired value otherwise after
a successful write, and copy chosen from actual application/connection evidence.
The novel decision remains limited to unknown outcomes. The final acceptance plan
also now names the actual strict schema fields and preserves the environment
object with null members. These were planning corrections before execution.
