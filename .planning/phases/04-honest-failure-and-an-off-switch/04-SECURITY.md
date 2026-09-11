---
phase: 04-honest-failure-and-an-off-switch
status: open_threats
reviewer: Codex independent gsd-security-auditor
review_pass: 1
review_stage: final_attempt_2
technical_verdict: secured_for_04_20_evidence_work
asvs_level: 1
block_on: high
reviewed_revision: 255ba31e2b25f7b8c5bde8a3900fb93151594f50
runtime_digest: 46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065
tests_digest: a48ee5a0fdfd6d7792879d22c557fceb34b8a221d23833d1c7f2e90bbd49fb66
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
threats_total: 82
threats_open: 4
technical_threats_open: 0
deferred_to_04_20: 4
accepted_log_recheck_pending: 0
---

# Phase 04 independent security audit

## Final attempt 2 verdict — technically secured for 04-20 evidence work

The independent gsd-security-auditor returned **OPEN_THREATS overall, with zero
technical threats open** at code revision 255ba31. All **82 threats** reconcile:
**66 mitigated, 12 documented accepted risks, four high threats deferred OPEN to
04-20**. No below-threshold open threat or unregistered flag remains. The four
deferred threats are final binding/provenance (T-04G3-21), validator/promotion
controls (22), safe authentic live harvest (23), and genuine ACK/judgments (24).
They remain requirements for 04-20, not waivers or current technical blockers.

This verdict supersedes the first attempt's mandatory 2 -> 2 halt at 028265e.
The user explicitly authorized the revised attempt by replying “proceed” after
the revised repair/review action was explained; 8f77223 records that authority.
History remains at 790872e/08ab51a. Attempt 2 independently converged runtime
findings **2 -> 0** at 31ed071 and harness warning **1 -> 0** at 255ba31.

| Finding / threat | Final disposition and independent evidence |
|---|---|
| CR-19-01 / T-04-05 | CLOSED at 199e642: pageshow clears readiness before resume. Held-read probes in both directions leave zero markers before fresh confirmation; newer changes defeat older reads. |
| CR-19-02 / T-04-13 | CLOSED at 31ed071: current state/document lifetime plus bounded fresh diagnosis after acknowledged application. Each new status await retains lifetime checks and the original deadline; same-document replacement, navigation, closure, reused IDs and responsive positive controls passed. |
| CR-19-03 / T-04G-23 | CLOSED at 31ed071: post-artwork generation and dispatch-time write epoch invalidate both diagnosis and preference certainty. Competing completed writes under held icon/title return unknown/mixed/disabled, then focus recovers the actual boolean, in both directions. |
| WR-19-01 | CLOSED at 255ba31: finite validated FIFO harness drain preserves pending work. Independent child stopped after exactly 1,000 callbacks; removed guard timed out and failed its clean-exit oracle. |

All other 63 previously closed mitigation dispositions remain independently
confirmed. The auditor checked all twelve accepted-log entries; their table
cells now state documented acceptance, not mitigation or new approval.

The final successful-write/rejected-with-populated-values-read tracer ran
independently in both directions. OFF -> ON persisted true; ON -> OFF persisted
false. Both returned saved:true, enabled:null, applied:false; status was neutral
for ON and off for OFF. The popup checkbox equalled the acknowledged desired
value, remained operable/nonmixed and showed saved/not-applied copy. Both had
zero markers and zero forbidden channels. Failed observation does not erase a
successful write acknowledgement.

The final whole-inventory review confirms admission deadlines and the 32-job cap;
expired queued work cannot dispatch. Raw-write exclusion lasts until the native
callback settles, including after response timeout, and pending reopen/focus
cannot confirm an earlier boolean. Native action ownership remains separate:
per-tab serialization, latest-candidate coalescing, generation checks and eventual
reconciliation prevent stale follow-on dispatch. Closed/reused-tab tests observe
retained Map entries and committed action logs across parked query/read/response/
icon/title boundaries. Dead-worker probes retain already-issued effects but
suppress old callbacks, timers, promises and subsequent API dispatch. This is
neither native cancellation nor verified cross-worker ordering.

Exact sender/schema/request-ID gates, finite primitives, worker-only one-boolean
storage, static permissions and package boundaries remain intact. Synthetic probes
used no live tenant or identifying payload. No packages, live harvest or tsc run.

Independent runner controls classify green as SURVIVED and intended assertion as
KILLED; unrelated failures, empty/malformed reports, missing/skipped execution,
timeouts, runner errors and stack-only labels are rejected. All 65 per-file
hashes and 39 unique intended kill records in 04-19-MEASUREMENTS.json were checked.
Executor full gate: **39/39 killed**, **423/423 prescribed-suite passes**,
**65/65 smoke passes** and **941/942 Vitest passes**. The sole default failure is
`phase-04-live-acceptance.test.js > the repository record binds to every current
shipped byte and reports its actual status`. It is the stale binding assigned
to 04-20; the default suite is explicitly not green. Independent packet checks
also passed 368/368 and 34/34.

| Inventory | Files | Aggregate SHA256 |
|---|---:|---|
| Runtime | 11 | 46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065 |
| Tests | 42 | a48ee5a0fdfd6d7792879d22c557fceb34b8a221d23833d1c7f2e90bbd49fb66 |
| Tools | 12 | f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323 |

The complete per-file inventory is in 04-19-MEASUREMENTS.json and 04-REVIEW.md;
both reports bind the same reviewed code revision and exact digests. Subsequent
report commits change no reviewed runtime/test/tool bytes.

Historical `popup-copy-fallback` and `project-guard-after-preference` remain
independently measured **SURVIVED**, excluded from 39 kills. Exact pair validation
rejects malformed input before rendering; downstream action admission/dispatch
enforces state/generation/deadline ownership. Thus the old ANY ONE deletion
promise is superseded at mechanism level, never declared fulfilled. Request
identity, document lifetime and fresh diagnosis are separate mechanisms. The
registry corrects its old ONLY-staleness wording; an inherited test comment is
historical explanatory debt, not the current security contract.

Pass-2 CR-01 and WR-01..06 have current technical evidence; IN-01's obsolete queue
branch is removed, IN-03 admission is guarded, IN-04 CSS spelling is retained,
IN-05 type checking remains unperformed. Pass-2 IN-02 locale-validator scope and
pass-1 IN-08 predecessor provenance remain assigned 04-20 warnings. Native-stall
and epoch limits retain only the exact approval at 04-DECISIONS.json. AR-04-01
still covers only language-icon-copy and structure-copy. Seven requirements,
seven edge classifications, three prohibition judgments, ACK and genuine human
observations remain unpromoted; Phase 3 remains human_needed.

## Historical first-attempt halt — superseded by the final verdict above

The independent auditor returned OPEN_THREATS after packet 2. Affected actionable
count remained **2 -> 2**, triggering 04-19 Task 3's mandatory stop rule. No 04-20
binding or human harvest may proceed. **76/82 closed or documented accepted;
2 high technical threats OPEN; 4 high threats deferred/open in 04-20.**

| Finding / threat | Verified repair | Remaining counterexample |
|---|---|---|
| CR-19-01 / T-04-05 | CLOSED at 199e642: readiness cleared before resume; independent four-direction held-read probe, 237 tests including registry and exact resume mutant 1/1 killed | None within packet scope |
| CR-19-02 / T-04-13 | Navigation, closure and reused-tab lifetime now refuse old replies | Same-document table replacement during captured successful application still returns working after current view became neutral |
| CR-19-03 / T-04G-23 | Post-icon/title invalidation now refuses old diagnosis | Opposite write completes while popup waits on icon; reply unavailable carries old enabled boolean and shows an operable, nonmixed switch opposite storage |

CR-19-02 exact independent recipe: boot stored=false, hold content-response,
request ON and capture successful application; replace document.body children,
settle, unhold/release response. Storage=true, markers=[], toolbar neutral/Checking,
but popup and set-enabled reply still working/applied=true. This known invalidation
precedes response construction. It is not a post-response snapshot limit.

CR-19-03 exact independent recipe: boot stored=P, hold icon for tab 7, open a fresh
popup and let it read P; another popup sends request 888 with enabled=!P and its
write completes; unhold/release icon. Storage=!P, other reply acknowledges !P,
but first popup-status is unavailable with enabled=P; checkbox P is operable and
not mixed. Independently reproduced P=true and P=false. A settled pendingWrite
mask cannot detect a completed intervening write. Native artwork risk does not
permit stale new JavaScript certainty.

Required next behavior, not executed: bounded fresh diagnosis after application,
and fresh preference evidence or conservative uncertainty after invalidation,
using the original admission deadline. WR-19-01 unbounded harness drain remains
an unrepaired code-review warning. The old request-id-echo registry note claiming
the ID is the ONLY staleness key is obsolete and uncorrected under the halt.

Independent packet-2 verification: four suites **356/356 passed**, diff check
passed. The executor's selected apply-document-lifetime, popup-post-action-status
and pending-reopen-certainty measurements each killed 1/1 intended target after
green baseline; they do not cover these newly exposed adjacent cases.
No final 36-mutant run, final full behavioral/default suite, final whole-inventory
semantic review or source-binding green is claimed. These remain unrun because
the explicit nondecreasing-findings gate stopped execution.

The auditor independently checked all twelve accepted-risk log entries after
0407533: documentation gaps CLOSED as documented accepted dispositions, not
remediated risks. The two 04-15 native/epoch residuals remain attributed to the
exact approved contract; AR-04-01 is not expanded.

The final source/test/tool aggregates in frontmatter match the code review.
04-REVIEW.md carries all 63 exact per-file hashes and the same reviewed revision.
The rest of this report preserves the initial audit evidence and register;
this final recheck overrides initial OPEN/accept-log states for T-04-05 and the
twelve accepted dispositions only. T-04-13/T-04G-23 remain OPEN for the narrowed
counterexamples above. No requirement or human judgment is promoted.

## Initial independent audit — historical basis

Initial independent structured verdict: **OPEN_THREATS**, 2026-09-11.
The separate gsd-security-auditor read the integrated runtime/test/tool boundaries,
constructed adversarial traces and returned the findings below. The executor
transcribes that verdict here. No canonical Phase 04 SECURITY file existed before
this audit and no prior SECURITY Git identity is implied. ASVS level 1 did not
short-circuit independent tracing because plan 04-19 explicitly requires it.

## Blocking counterexamples

- **CR-19-01 / T-04-05:** content.js onPageShow resumes from old preferenceReady
  before fresh storage confirmation. ON -> pagehide/freeze -> persist OFF ->
  thaw with held content-read -> pageshow leaves four markers while stored OFF.
  Release clears them. A stalled read makes the stale repaint indefinite.
- **CR-19-02 / T-04-13:** capture actual old-document applied:true/working,
  replace or close its tab, release. Worker reports applied:true/working and popup
  says working while the replacement has no markers and toolbar is neutral.
  Request ID identifies the request but does not prove document lifetime.
- **CR-19-03 / T-04G-23:** hold popupStatus icon, remove current table and
  invalidate, release. Toolbar reconciles neutral/Checking, newly returned popup
  still says working. Missing recheck after the native-action await.

Both independent reviewers reproduced these defects. Approved transient native
artwork permits an already-issued physical effect, not a freshly constructed
stale JavaScript response. Approved native-stall/cross-worker limits do not waive
any of these three defects. Code-review warning WR-19-01 separately records the
inherited unbounded chrome-harness.flush drain; it also needs a bounded repair.

## Register and declared mitigation evidence

All 82 threat rows were extracted from the current Phase 04 plans. CLOSED below
means the independent auditor verified the declared mitigation in its scope,
not that the phase or live acceptance is complete. Related open defects remain
separate even when narrower checks are closed.

| Threat | Severity | Disposition | Audit state | Plan and declared mitigation |
|---|---|---|---|---|
| T-04-01 | high | mitigate | CLOSED — declared mitigation verified | 04-01-PLAN.md: Preserve exact user responses; require all three explicit choices before dependent implementation. |
| T-04-02 | high | mitigate | CLOSED — declared mitigation verified | 04-01-PLAN.md: Conflicts with D-05/D-06/D-11 trigger replan instead of silent permission or persistence expansion. |
| T-04-03 | high | mitigate | CLOSED — declared mitigation verified | 04-02-PLAN.md: Exact sender ID/frame/document and packaged-popup origin checks; reject payload-selected identity and malformed schemas. |
| T-04-04 | high | mitigate | CLOSED — declared mitigation verified | 04-02-PLAN.md: Finite enum/boolean protocol and forbidden-channel sentinels; no ticket values, URL, DOM or raw errors transmitted or logged. |
| T-04-05 | high | mitigate | CLOSED — resume readiness independently verified | 04-02-PLAN.md: Register change listener before read; generation checks; false/failure cannot become default-on. |
| T-04-06 | high | mitigate | CLOSED — declared mitigation verified | 04-02-PLAN.md: Resolve and verify historical Git bytes before edits; keep eleven passes/nine pending source-bound. |
| T-04-07 | high | mitigate | CLOSED — declared mitigation verified | 04-02-PLAN.md: Pin storage-only permission, static matches, isolated world, top-frame injection and exact packaged assets. |
| T-04-08 | high | mitigate | CLOSED — declared mitigation verified | 04-03-PLAN.md: Three D-01 predicates, fresh callback inspection, revision invalidation and 99/100 ms/burst tests. |
| T-04-09 | high | mitigate | CLOSED — declared mitigation verified | 04-03-PLAN.md: Per-tab queues/generations, current-frame handshake and delayed-navigation tests. |
| T-04-10 | medium | mitigate | CLOSED — declared mitigation verified | 04-03-PLAN.md: One finite settle timer, cancellation on pause/off, no retries after confirmation and zero timers at rest. |
| T-04-11 | high | mitigate | CLOSED — declared mitigation verified | 04-03-PLAN.md: Fixed finite reason copy; no raw DOM/lang/error output and no Zendesk page diagnostic. |
| T-04-12 | high | mitigate | CLOSED — declared mitigation verified | 04-04-PLAN.md: Exact desired boolean, serialized writes, generation checks and cross-popup delayed-response tests. |
| T-04-13 | high | mitigate | CLOSED — lifetime and fresh diagnosis independently verified | 04-04-PLAN.md: Validate current sender document and await cleanup/reconciliation; distinguish persistence from actual application. |
| T-04-14 | medium | mitigate | CLOSED — declared mitigation verified | 04-04-PLAN.md: Disconnect existing observer, clear all timers, no keepalive, reread only on real lifecycle events. |
| T-04-15 | high | mitigate | CLOSED — declared mitigation verified | 04-04-PLAN.md: Strict single enabled key, local area only, no diagnostic storage or sensitive payloads; sentinel tests across all contexts. |
| T-04-16 | medium | accept | CLOSED — documented accepted risk | 04-04-PLAN.md: Platform may prevent physical removal; bounded attempts release references and popup reports application failure rather than claiming tint cleared. This inherited platform limit does not waive CTRL-04 on functioning APIs. |
| T-04-17 | high | mitigate | CLOSED — declared mitigation verified | 04-05-PLAN.md: Exact source hashes, complete IDs, dates/status validation and negative forged-pass tests. |
| T-04-18 | high | mitigate | CLOSED — declared mitigation verified | 04-05-PLAN.md: Six-run completeness, identical source/environment, preserved prior records and fixed budgets. |
| T-04-19 | high | mitigate | CLOSED — declared mitigation verified | 04-05-PLAN.md: User-owned checkpoint protocol, no ticket values/screenshots/credentials; record aggregate facts only. |
| T-04-20 | high | mitigate | CLOSED — declared mitigation verified | 04-06-PLAN.md: Permit only exact boolean storage/status APIs; retain all forbidden-channel and package-boundary assertions. |
| T-04-21 | high | mitigate | CLOSED — declared mitigation verified | 04-06-PLAN.md: Initialize actual shipped bytes before measurement, retain accounting, and preserve original Phase 3 samples. |
| T-04-22 | high | mitigate | CLOSED — declared mitigation verified | 04-06-PLAN.md: Reject unexpected keys, properties and ticket-bearing payloads; retain no-network and no-console sentinels. |
| T-04G-01 | medium | mitigate | CLOSED — declared mitigation verified | 04-07-PLAN.md: The broadened predicate still returns a fixed reason token. The declared `lang` value is never read out, transmitted, interpolated into copy or logged — Task 1 keeps the refusal body unchanged, and `toolbar-popup.test.js`'s existing assertion that every action title comes from the finite `COPY` set stays green. |
| T-04G-02 | low | accept | CLOSED — documented accepted risk | 04-07-PLAN.md: A page can set its own `documentElement.lang` and thereby switch its own tinting on or off. Identical exposure to today's exact-match selector; the page already owns its own DOM and no extension state or user data crosses the boundary. |
| T-04G-03 | low | accept | CLOSED — documented accepted risk | 04-07-PLAN.md: A non-English shell that declares an `en-` prefixed tag now tints. The consequence is an unhelpful tint on labels the detector will refuse anyway, not a privilege or data exposure. Refusing it would require a locale-independent priority signal, which Phase 1 established does not exist (D-08). |
| T-04G-04 | high | mitigate | CLOSED — declared mitigation verified | 04-08-PLAN.md: This is WR-04 itself: one silent top frame currently wedges the single preference writer for every tab until the worker is terminated. Task 1 bounds both hops at `REQUEST_TIMEOUT_MS`, so the queue always drains and the switch stays operable. Asserted by the second-request test in `failure-seam.test.js` and by the two `*-unbounded` mutants. |
| T-04G-05 | high | mitigate | CLOSED — declared mitigation verified | 04-08-PLAN.md: A missing or wrong `frameId` would let a subframe answer for the document. The bound must not disturb the options argument; the two `*-frameid` mutants require the suite to go red if it is dropped, and WR-10's recorded-violation channel is what makes that failure visible rather than a plausible `unavailable`. |
| T-04G-06 | medium | mitigate | CLOSED — declared mitigation verified | 04-08-PLAN.md: A read that fails while also delivering the defaults object must not be read as absence, or a storage error would tint a view the agent switched off. Task 2 makes both `lastError` branches load-bearing; the two `*-lasterror` mutants require each to be killed. |
| T-04G-07 | low | accept | CLOSED — documented accepted risk | 04-08-PLAN.md: `fromContent` and `fromPopup` are untouched by this plan and remain pinned by named negative tests. No new message type, no new sender path, no new permission. |
| T-04G-08 | low | mitigate | CLOSED — declared mitigation verified | 04-08-PLAN.md: The gate copies the repository — including `.planning/` — into a `mkdtempSync` directory. It removes the copy in a `finally`, symlinks rather than copies `.git`, and prints only mutant ids and exit statuses, never file contents. |
| T-04G-09 | high | mitigate | CLOSED — declared mitigation verified | 04-09-PLAN.md: This is WR-09: a mis-invoked run currently exits 0 having measured nothing, and six such runs are the recorded timing evidence. Task 1 throws on any unrecognised mode or non-positive-integer size before measurement, and the report now labels itself from the validated value rather than from a derived boolean. Covered by the VM rejection test. |
| T-04G-10 | medium | mitigate | CLOSED — declared mitigation verified | 04-09-PLAN.md: The `disabled` label invites a reader to treat a no-extension page as the cost of the shipped off state. Task 2 names it `runtime: 'absent'` and adds `dormant` as the run that actually loads the controller, so the recorded evidence distinguishes them. |
| T-04G-11 | low | accept | CLOSED — documented accepted risk | 04-09-PLAN.md: The served route table is a fixed list of repository paths; no user input reaches it, and the isolated Chrome runs in a `mkdtemp` profile with background networking disabled. Unchanged by this plan. |
| T-04G-12 | medium | mitigate | CLOSED — declared mitigation verified | 04-09-PLAN.md: Requiring `runtime` unconditionally would invalidate Phase 3's bound samples and turn a green suite red for a reason unrelated to Phase 3. The new requirement is conditional on `run.mode === 'dormant'`, and the no-`runtime` disabled case is pinned by a test. |
| T-04G-13 | high | mitigate | CLOSED — declared mitigation verified | 04-10-PLAN.md: This is WR-07: the control asserts a preference value nothing confirmed while the copy says the save failed. Task 1 reverts to `lastConfirmed`, and `popup-no-revert` requires the suite to go red if that is removed. |
| T-04G-14 | high | mitigate | CLOSED — declared mitigation verified | 04-10-PLAN.md: An unbounded wait plus a permanently disabled control makes the off switch unusable for the life of the popup, with focus dropped into `body`. Tasks 1 and 2 bound the request and keep the control operable; `popup-ask-unbounded`, `popup-stays-disabled` and `popup-focus-guard` each require a red suite if reverted. |
| T-04G-15 | low | accept | CLOSED — documented accepted risk | 04-10-PLAN.md: `requestEnabled` still sends the desired value outright rather than inverting a stale reading, and the popup still holds no storage surface of its own. `lastConfirmed` is display state only — it is never sent, and it is only ever assigned from a value storage reported back. Asserted by the unchanged one-request-at-a-time and single-writer tests. |
| T-04G-16 | medium | mitigate | CLOSED — declared mitigation verified | 04-10-PLAN.md: A new failure string would be un-ratified product copy and could leak a diagnosis about the view. Task 1 introduces none; the two `grep -c` criteria pin the ratified set at exactly one occurrence each, and `COPY` is untouched. |
| T-04G-17 | high | mitigate | CLOSED — declared mitigation verified | 04-11-PLAN.md: Re-pointing the existing hashes at the new bytes would forge a binding: fourteen observations would appear to attest bytes they never saw. Task 3 recomputes the digests, resets every check to pending, and preserves the originals in history. The `observation-date` and `source-hashes` gates make a forged combination unrepresentable, and the byte pin proves the binding is live. |
| T-04G-18 | high | mitigate | CLOSED — declared mitigation verified | 04-11-PLAN.md: This task edits the validator and the record it validates in the same commit, which is exactly how a guard gets quietly relaxed. The edit is confined to `REQUIRED_IDS` and the language-context branch; the acceptance criteria pin `SCOPE`, `PROHIBITION_IDS`, `PROHIBITION_STATUSES`, `TIMING_KEYS` and `TIMING_ASSETS` as untouched, and the three-prohibition flagged-unverified guard is explicitly retained. |
| T-04G-19 | high | mitigate | CLOSED — declared mitigation verified | 04-11-PLAN.md: An addendum is the point at which a waiver is most easily rewritten into evidence. The addendum states only what changed about the branch's domain, keeps both checks pending, and repeats that the waiver permits progression and is not evidence. Verified by the pass-count-zero and pending-count-seventeen criteria and by the human check. |
| T-04G-20 | medium | mitigate | CLOSED — declared mitigation verified | 04-11-PLAN.md: Writing a completion record for work another agent executed risks manufacturing a first-hand report. The summary states its provenance in its first paragraph, names the four commits it derives from, and claims no live observation — pinned by an acceptance criterion. |
| T-04G-21 | low | accept | CLOSED — documented accepted risk | 04-11-PLAN.md: The preserved records contain only dated, sanitized, aggregate outcomes; the original validator already rejected any observation text containing a URL, an email-shaped string or a six-or-more-digit run, so the copies inherit that guarantee. |
| T-04G-22 | low | accept | CLOSED — documented accepted risk | 04-11-PLAN.md: The six-run matrix takes several minutes of real wall clock. Accepted: shortening the protocol would invalidate the comparison with the recorded budgets, and `mergeReport`'s already-exists refusal prevents a partial rerun from silently overwriting a slow sample. |
| T-04G-23 | high | mitigate | CLOSED — projection/preference freshness; mechanism contract supersedes individual-guard promise | 04-12-PLAN.md: An unguarded worker paints one tab's diagnosis onto another tab's toolbar and lets a positive `working` survive a navigation — a false statement about the document in front of the agent. Historical individual-deletion promise is superseded by the independently justified mechanism-level contract above; survivors remain survivors. |
| T-04G-24 | high | mitigate | CLOSED — declared mitigation verified | 04-12-PLAN.md: The named guardian test currently cannot fail, and `04-VALIDATION.md` cites it as half of the pair that prevents a silent regression. Task 1 repairs it in place under the same name, so the citation stays true, and the mutant gate proves it. |
| T-04G-25 | medium | mitigate | CLOSED — declared mitigation verified | 04-12-PLAN.md: A harness hold that changed existing behaviour would silently alter every suite that shares the double. `responseDelays`, `silenceContent` and `setActionDelay` all default to today's behaviour, and the full-directory verify run is what proves no existing test moved. |
| T-04G-26 | medium | mitigate | CLOSED — declared mitigation verified | 04-12-PLAN.md: A mutant that kills the suite by breaking the parse, or one whose `suites` include the byte pin, reports as killed for the wrong reason — the exact failure mode the review uncovered. Acceptance requires each scratch run to fail on an assertion, forbids the byte-pin suite, and forbids a `count` above one. |
| T-04G-27 | high | mitigate | CLOSED — declared mitigation verified | 04-13-PLAN.md: This is the only staleness key on the apply path, and its deletion currently passes the suite. `request-id-echo` requires the suite to go red, and the wrong-echo tests on both paths are what make it do so. |
| T-04G-28 | high | mitigate | CLOSED — declared mitigation verified | 04-13-PLAN.md: With the gate bypassed, any object reaching the worker becomes a diagnosis about the agent's view. The seven illegal-shape cases and `status-reply-gate` make refusal load-bearing. |
| T-04G-29 | high | mitigate | CLOSED — declared mitigation verified | 04-13-PLAN.md: A bypassed pairing clause writes one state's artwork under another state's title, or leaves the previous claim standing — a false statement about the view, which is what FAIL-05 exists to prevent. `diagnosis-pairing` plus the clean-fallback behavioural test and the no-valueless-title invariant close it. |
| T-04G-30 | medium | mitigate | CLOSED — declared mitigation verified | 04-13-PLAN.md: The popup is the second line of defence if the worker is buggy. `popup-valid-gate` and `popup-copy-fallback` make both halves load-bearing. |
| T-04G-31 | medium | mitigate | CLOSED — declared mitigation verified | 04-13-PLAN.md: A regex that silently matches nothing would make the completeness assertion pass vacuously — the exact defect being fixed elsewhere in this run. Each parsed map carries a minimum-count assertion, so an empty parse fails. |
| T-04G-32 | low | accept | CLOSED — documented accepted risk | 04-13-PLAN.md: `fromContent` and `fromPopup` are untouched and remain pinned by named negative tests. This plan adds no message type and no sender path; the rogue listeners it registers are inside the double's own per-tab list, which models a legitimate content script, not a foreign one. |
| T-04G-33 | high | mitigate | CLOSED — declared mitigation verified | 04-14-PLAN.md: Without the queue, two concurrent requests can commit out of order and leave the agent's tinting in the state they did not ask for — the persisted boolean inverted under them. The single-writer invariant asserts at most one write is ever in flight, and `preference-serialization` requires the suite to go red if the queue is collapsed. |
| T-04G-34 | medium | mitigate | CLOSED — declared mitigation verified | 04-14-PLAN.md: An unbounded map grows for the life of the worker across every navigation and tab switch in the browser, which `IN-04` notes is every tab. Both halves of the cleanup are guarded by separate source-shape assertions, and two mutants require each half to be load-bearing. Residual: the guard is a shape check, recorded as a flagged assumption above. |
| T-04G-35 | high | mitigate | CLOSED — declared mitigation verified | 04-14-PLAN.md: The test currently claims to prevent inversion and passes without the mechanism that prevents it — a green result presented as a guard. It is rewritten in place under the same name so `04-06`'s headline claim stays true, and the mutant proves it. |
| T-04G-36 | low | accept | CLOSED — documented accepted risk | 04-14-PLAN.md: Unchanged: `background.js` remains the only file containing a storage write, the content script and popup are refused write surfaces by the doubles as forbidden channels, and this plan adds no writer and no new key. |
| T-04G3-01 | high | mitigate | CLOSED — declared mitigation verified | 04-15-PLAN.md: Joint bidirectional oracle; successful write acknowledgement cannot be replaced by stale display state. |
| T-04G3-02 | high | mitigate | CLOSED — declared mitigation verified | 04-15-PLAN.md: Blocking attributed choice; preserve ratified responses and separate proposal from approval. |
| T-04G3-03 | high | mitigate | CLOSED — declared mitigation verified | 04-15-PLAN.md: Synthetic fixtures and primitive outcomes only; exact API/forbidden-channel assertions under D-05/D-06. |
| T-04G3-04 | high | mitigate | CLOSED — declared mitigation verified | 04-16-PLAN.md: Absolute admission deadline, 32 pending cap, inert expired requests, independently parked hops. |
| T-04G3-05 | high | mitigate | CLOSED — declared mitigation verified | 04-16-PLAN.md: Raw-write exclusion survives response timeout; bidirectional commit/callback schedule assertions. |
| T-04G3-06 | high | mitigate | CLOSED — declared mitigation verified | 04-16-PLAN.md: Exact schema, primitive enum, sender/request-id guards and fresh-request ownership. |
| T-04G3-07 | high | mitigate | CLOSED — declared mitigation verified | 04-16-PLAN.md: Physical per-tab serialization, generation recheck, coalesced reconciliation and retention tests. |
| T-04G3-08 | medium | accept | CLOSED — documented accepted risk | 04-16-PLAN.md: Only the exact 04-15 attributed limit may be accepted; one boolean gives no durable exclusion. Document and independently review, never label verified ordering. |
| T-04G3-09 | medium | accept | CLOSED — documented accepted risk | 04-16-PLAN.md: Approved 04-15 limit only: responsive requests and honest uncertainty, no promise that caller timers repair Chrome storage/action. |
| T-04G3-10 | high | mitigate | CLOSED — declared mitigation verified | 04-17-PLAN.md: Keep raw paint guard and reason-only normalization separate; assert both surfaces for every named malformed shell. |
| T-04G3-11 | high | mitigate | CLOSED — declared mitigation verified | 04-17-PLAN.md: Exact nonempty four-rule source guard plus actual Chrome matrix; do not trust happy-dom alone. |
| T-04G3-12 | high | mitigate | CLOSED — declared mitigation verified | 04-17-PLAN.md: Isolated temporary profile, synthetic fixture only, primitive outputs, no authenticated browser or network destination. |
| T-04G3-13 | medium | mitigate | CLOSED — declared mitigation verified | 04-17-PLAN.md: Label synthetic scope and reserve live IDs for attributed 04-20 observations. |
| T-04G3-14 | high | mitigate | CLOSED — declared mitigation verified | 04-18-PLAN.md: Green baseline, structured target/marker matching and explicit infrastructure rejection. |
| T-04G3-15 | high | mitigate | CLOSED — declared mitigation verified | 04-18-PLAN.md: Canonical containment, traversal/symlink rejection before disposable writes; real tree stays read-only. |
| T-04G3-16 | medium | mitigate | CLOSED — declared mitigation verified | 04-18-PLAN.md: Process deadline, separate GATE_ERROR and finally cleanup; no timeout kill credit. |
| T-04G3-17 | high | mitigate | CLOSED — declared mitigation verified | 04-18-PLAN.md: Shared validator under npm test; source/suite drift cannot stay silently green. |
| T-04G3-18 | high | mitigate | CLOSED — declared mitigation verified | 04-19-PLAN.md: Exact digest, independent counterexamples and mandatory re-review after all fixes. |
| T-04G3-19 | high | mitigate | CLOSED — declared mitigation verified | 04-19-PLAN.md: Current-contract dispositions and canonical status check; no promotion from SUMMARY metadata. |
| T-04G3-20 | high | mitigate | CLOSED — declared mitigation verified | 04-19-PLAN.md: Synthetic data and bounded outcomes; no live tenant or identifying payloads in reports. |
| T-04G3-21 | high | mitigate | OPEN — deferred to 04-20 | 04-20-PLAN.md: Final reviewed inventory, separate timing identity, genuine loaded-source confirmation and historic provenance. |
| T-04G3-22 | high | mitigate | OPEN — deferred to 04-20 | 04-20-PLAN.md: Negative controls, independent validation-only review before UAT, post-bookkeeping canonical guard. |
| T-04G3-23 | high | mitigate | OPEN — deferred to 04-20 | 04-20-PLAN.md: User-controlled sensitive navigation; bounded counts/enums and no identifying payloads. |
| T-04G3-24 | high | mitigate | OPEN — deferred to 04-20 | 04-20-PLAN.md: Genuine attributed ACK/judgments, pending unavailable checks and unchanged AR-04-01 scope. |

## Accepted-risk log

- **T-04-16 (medium)**, 04-04-PLAN.md: Platform may prevent physical removal; bounded attempts release references and popup reports application failure rather than claiming tint cleared. This inherited platform limit does not waive CTRL-04 on functioning APIs.
- **T-04G-02 (low)**, 04-07-PLAN.md: A page can set its own `documentElement.lang` and thereby switch its own tinting on or off. Identical exposure to today's exact-match selector; the page already owns its own DOM and no extension state or user data crosses the boundary.
- **T-04G-03 (low)**, 04-07-PLAN.md: A non-English shell that declares an `en-` prefixed tag now tints. The consequence is an unhelpful tint on labels the detector will refuse anyway, not a privilege or data exposure. Refusing it would require a locale-independent priority signal, which Phase 1 established does not exist (D-08).
- **T-04G-07 (low)**, 04-08-PLAN.md: `fromContent` and `fromPopup` are untouched by this plan and remain pinned by named negative tests. No new message type, no new sender path, no new permission.
- **T-04G-11 (low)**, 04-09-PLAN.md: The served route table is a fixed list of repository paths; no user input reaches it, and the isolated Chrome runs in a `mkdtemp` profile with background networking disabled. Unchanged by this plan.
- **T-04G-15 (low)**, 04-10-PLAN.md: `requestEnabled` still sends the desired value outright rather than inverting a stale reading, and the popup still holds no storage surface of its own. `lastConfirmed` is display state only — it is never sent, and it is only ever assigned from a value storage reported back. Asserted by the unchanged one-request-at-a-time and single-writer tests.
- **T-04G-21 (low)**, 04-11-PLAN.md: The preserved records contain only dated, sanitized, aggregate outcomes; the original validator already rejected any observation text containing a URL, an email-shaped string or a six-or-more-digit run, so the copies inherit that guarantee.
- **T-04G-22 (low)**, 04-11-PLAN.md: The six-run matrix takes several minutes of real wall clock. Accepted: shortening the protocol would invalidate the comparison with the recorded budgets, and `mergeReport`'s already-exists refusal prevents a partial rerun from silently overwriting a slow sample.
- **T-04G-32 (low)**, 04-13-PLAN.md: `fromContent` and `fromPopup` are untouched and remain pinned by named negative tests. This plan adds no message type and no sender path; the rogue listeners it registers are inside the double's own per-tab list, which models a legitimate content script, not a foreign one.
- **T-04G-36 (low)**, 04-14-PLAN.md: Unchanged: `background.js` remains the only file containing a storage write, the content script and popup are refused write surfaces by the doubles as forbidden channels, and this plan adds no writer and no new key.
- **T-04G3-08 (medium)**, 04-16-PLAN.md: Only the exact 04-15 attributed limit may be accepted; one boolean gives no durable exclusion. Document and independently review, never label verified ordering.
- **T-04G3-09 (medium)**, 04-16-PLAN.md: Approved 04-15 limit only: responsive requests and honest uncertainty, no promise that caller timers repair Chrome storage/action.

These twelve entries preserve plan-authored dispositions; they are not invented
new user approvals. T-04G3-08/09 additionally have the exact attributed 04-15
approved decision in DECISIONS.json. T-04G-15's obsolete universal lastConfirmed
wording is superseded by fresh readable boolean, otherwise acknowledged desired
value after successful save. Permanently broken native removal does not waive
CTRL-04 on functioning APIs. The auditor must check this log before treating the
twelve accepted dispositions as logged. No transfer rows exist.

AR-04-01 remains a separate authentic waiver of only language-icon-copy and
structure-copy live scenarios. It does not expand to transaction limits, these
defects or seven unresolved edge classifications.

## Direct evidence and assurance boundaries

Independent actual-source successful-write/failed-read traces in both directions
return saved=true, enabled=null, applied=false; storage and the operable nonmixed
checkbox equal the requested value, saved/not-applied copy appears, markers=[],
forbidden=[]. Failed read is not failed save.

- Prescribed preference-outcome + mutation-gate: **234 passed**, exit 0.
- Nine further toolbar, worker-integrity, runtime-contract, diagnosis,
  mutation-registry, failure-seam, toggle, performance-harness and locale-rendering
  suites: **266 passed**, exit 0.
- Selected actual confirmed-write-revert: **1/1 KILLED**, green disposable baseline,
  first-line [outcome:confirmed-write-checkbox] assertion.
- Independent adjudicator controls: green SURVIVED; intended assertion KILLED.
  Unrelated marker, empty/malformed reports, absent/skipped target, unhandled error,
  timeout/signal and marker only in stack were rejected.
- No shipped network, console, web-storage or dynamic-markup channel found.
  Sole local-storage writer and exact popup-origin gate remain intact.
- Full mutation run and final integrated identity await repairs. No tsc run claimed.

04-12 ANY ONE individual-guard promise is superseded at mechanism level because
FAIL-05 concerns observable freshness/isolation; redundant syntax need not fail
alone. Excluded popup-copy-fallback and project-guard-after-preference remain
measured survivors, not kills. New stale-response defects still block the full
freshness contract. 04-14 closed-tab tests now measure worker Map retention,
attempted calls and committed paints separately; no source-shape proxy is accepted.

## Deferred and human gates

T-04G3-21..24 remain OPEN, owned by 04-20: final reviewed runtime/timing identity,
validator/promotion corrections and independent validation-only review, privacy
of the future live harvest, and genuine ACK/judgment evidence. They are separate
from technical_threats_open so their own dependency does not become circular.

Pass2 IN-02 still needs the primary/supplemental language scope correction and
non-English-negative validator (current bare-en-only refusal admits en-GB).
Pass2 IN-05 remains unimplemented type tooling advice under no-new-packages.

All seven Phase 04 requirements remain unresolved. Seven edge classifications,
prohibitions, current-source human observations and ACK-04-01 remain pending.
Phase 03 stays human_needed with eleven passes/nine pending. Old summaries and
archived observations cannot promote current acceptance.

## Identity

Sorted tracked extension paths (11), test paths (40), scripts plus package files
and Vitest config (12); SHA256 each byte stream, then SHA256 of concatenated
'<hash>  <path>\n' lines. Aggregates above independently agree with code reviewer.
Final identities must be refreshed and both reviews rechecked after every repair.
