# Preference outcome contract

Prepared 2026-09-11 by 04-15 Task 1. **Unknown-outcome proposal awaits the user's
04-15 Task 2 decision.** No new copy, uncertainty state, deadline, or residual-risk
acceptance is authorized by this document. Existing decisions remain verbatim in
04-DECISIONS.json; the two operational failure strings are ratified in UAT 21.

## Confirmed behavior repaired and measured

The worker reports three independent facts: `saved` acknowledges the write,
`enabled` is read-back, and `applied` acknowledges the current document. Popup
display precedence is a returned boolean first, otherwise the desired boolean
**only when saved is true**. Failed read-back does not undo an acknowledged write.
The worker uses that same precedence when selecting operational reply copy;
its read-back field remains null when unreadable. No protocol or storage change.

20 new actual-source tests exercise both directions through createWorld,
loadWorker, loadContent and loadPopup. Joint observations include the entire
stored object, checkbox checked/disabled/indeterminate, status text, current
markers, focus, request/reply IDs, write log and forbidden channels. These are
synthetic VM observations, not live Chrome or Zendesk acceptance. Existing
popup-recovery tests additionally model native disabled-control focus behavior.

RED: 37 executed tests, 10 intended assertion failures, 27 passes; exit 1.
Eight new cases and two corrected toggle cases expose the old contradiction.
04-15-RED.json retains raw Vitest TAP and explicitly documents its summary-count
adapter for GSD's Node-TAP checker, which returned RED_EVIDENCE_OK.
Initial GREEN: 48/48 across preference-outcome, toggle and popup-recovery.
A second RED isolated the successful-application/worker-only-read-failure path:
20 executed, 1 failed (OFF reported checking), 19 passed, exit 1. Its separate
04-15-OPERATIONAL-RED.json also passed RED_EVIDENCE_OK. The worker now uses
acknowledged OFF for operational reply copy without changing the read-back field.
Final verification totals are recorded in 04-15-SUMMARY.md.

| Write/read/application | Actual stored state | Checkbox | Copy and application evidence |
|---|---|---|---|
| true → false; save succeeds; rejected/rejected-with-values/throwing/malformed reads | false | false, enabled, not mixed | Setting saved, but this view did not update; applied=false; no markers |
| false → true; same four read faults | true | true, enabled, not mixed | Same saved/not-applied copy; applied=false; no markers because content cannot confirm its preference |
| Save succeeds, only worker read-back fails, content applies successfully | D | D, enabled | Tinting is off for false; Priority tinting is working for true; applied=true |
| Save D; later independently stored opposite boolean P is readable | P | P, enabled | Fresh P wins; working/tinted for true, off/untinted for false; applied=true |
| Write definitively rejects or throws, both directions; read succeeds | Original P | P, enabled, focus retained | Zhroma could not save that setting; next healthy explicit request succeeds |
| Save succeeds; explicit valid negative application reply | D | D, enabled | Setting saved, but this view did not update; marker-removal failure remains covered by toggle test |
| Save succeeds; document absent or apply reply has wrong ID | D | D, enabled | No readable view is connected; applied=false; no application success inferred |

The failed-read cases prove acknowledged save, not successful document application.
An untinted document alone cannot establish application: after a failed read the
content controller is unconfirmed/dormant, even when D is false. Fixed copy follows
the explicit application acknowledgement rather than guessing from marker count.

## Complete outcome table

P = last confirmed preference, D = explicitly requested value. The rows classify
families of outcomes, not a claim that every Cartesian combination is implemented
or tested. Independent stage/epoch controls and the full matrix belong to 04-16.

| Stage / outcome family | Required interpretation and behavior | Evidence / state |
|---|---|---|
| Initial absent key | Default-on true only from a successful defaulted read; no new stored key required | Existing toggle initial/default test |
| Initial true / false | Display confirmed boolean; content obeys it when runnable | Existing toggle restart cases and new bidirectional setup |
| Initial invalid / null / failed read | Failure is not absence; do not infer true | Existing startup failure tests; explicit unknown presentation still proposed |
| Write success; read same D; apply success | Confirm D and current application; normal working/off copy | Existing off/on tests |
| Write success; read opposite boolean P | Later readable P wins over D; saved still true | New independently altered read-back cases |
| Write success; read invalid/failure/throw | Acknowledged D remains confirmed; application/connection decides copy | Eight new joint cases |
| Write success; read stalls | Preserve acknowledged save in bounded response; do not await forever | OPEN 04-16; current read awaits indefinitely |
| Write rejected or throws before commit; read succeeds | Report definite failed save; show readable P and retain retry/focus | New both-direction rejection/throw and recovery cases |
| Write rejected; read invalid/fails | Failed save is definite; only valid earlier confirmation may be shown | Existing fallback mechanism; full cross-product 04-16 |
| Write not started: queue expired / admission refused | Explicit not-started result; never dispatch that request after expiry | PROPOSED 04-16; no current admission bound |
| Write issued, pending before physical commit | Outcome unknown, not failed; no second raw write | PROPOSED uncertainty state and native exclusion |
| Write physically committed before callback | Still unknown to JS until callback; a read must not release raw-write exclusion | PROPOSED; independent commit/callback controls in 04-16 |
| Callback settles after response deadline | Do not overwrite a newer popup request; release exclusion only on real completion | PROPOSED late-effect/ownership tests in 04-16 |
| Apply succeeds with valid fresh reply | May report application only after exact type/id/pair checks | Existing protocol plus positive toggle cases |
| Apply explicitly false with valid reply | Acknowledged save plus not-applied copy, unless status itself unavailable | New failed-read cases and existing permanent-removal case |
| Apply refused / malformed / wrong ID / absent | No successful application claim; connection unavailable | New absent/wrong-ID cases; existing worker-integrity tests |
| Apply silent | Worker hop currently bounded at 2000 ms; preserve save, report unavailable | Existing failure-seam; whole-operation coverage OPEN |
| Apply late | Captured stale reply must not authorize current application/overwrite newer UI | OPEN comprehensive request/generation ownership 04-16 |
| Queued request | Budget begins at worker admission, including queue residence; bounded admission | PROPOSED; queue currently unbounded |
| Expired queued request | Return within budget; never initiate its storage write during later drain | PROPOSED 04-16 |
| Reopened / refocused popup | Fresh bounded read; mixed/unavailable while native write remains pending | PROPOSED; current popup refreshes on creation only |
| Transport timeout or illegible worker response | Unknown save, not proof saving failed | OPEN 04-16; current fallback still uses failed-save copy |
| Worker recreated with no pending native effect | Read persisted boolean; do not resurrect remembered diagnosis | Existing VM recreation tests; real restart acceptance separate |
| Worker terminated with native write pending | Dead JS cannot continue; already-issued native effect may land later | PROPOSED faithful epoch tests; no cross-worker ordering guarantee |

## Every asynchronous wait and queue

Current source inventory, before 04-16. “Unbounded” describes the production
wait, not the test double's fallback port close. Two bounded individual hops
do not bound the whole request or an unlimited queue.

| Function / stage | Current await or pending operation | Current bound | Proposed treatment in 04-16 |
|---|---|---|---|
| setEnabled admission | preferenceQueue.then(task, task) | None | Count queue residence in 4000 ms admission budget; bounded admission |
| setEnabled | await writePreference(desired) → storage.local.set callback | None | Bound response, retain exclusive raw writer until physical callback settles |
| setEnabled | await readPreference() → storage.local.get callback | None | Remaining absolute budget; preserve already acknowledged save |
| setEnabled | await activeTab() → tabs.query | None | Remaining absolute budget |
| setEnabled | await requestApply() → bounded tabs.sendMessage | 2000 ms hop | Minimum of hop and remaining request budget |
| setEnabled | project(tab.id), intentionally not awaited | Separate queue; unbounded stages below | Independent bounded projection; avoid extending request lifetime |
| popupStatus | await activeTab() | None | Absolute status request budget |
| popupStatus, no active tab | await readPreference() | None | Remaining status budget |
| popupStatus, active tab | await requestStatus() | 2000 ms message hop | Remaining status budget |
| popupStatus, active tab | await readPreference() | None | Remaining status budget |
| popupStatus, active tab | await applyAction() | None | Bound observation; retain native side-effect ownership |
| project | per-tab state.queue.then(...) | None | Expire/coalesce queued observations without starving healthy later work |
| project | await requestStatus() | 2000 ms message hop | Absolute projection deadline |
| project | await readPreference() | None | Remaining projection budget, generation checked after return |
| project | await applyAction() | None | Bound observation separately from physical artwork completion |
| applyAction | await chrome.action.setIcon | None | Already-issued native write cannot be cancelled; reconcile after completion |
| applyAction | await chrome.action.setTitle | None | Same physical ownership rule; prevent stale completion claims |
| popup refresh/requestEnabled | await ask(message) | 5000 ms transport fallback | Preserve outer 5000 ms; add request ownership and exact unknown outcome |
| popup ask | await Promise.race(sendMessage, deadline) | 5000 ms; timer cleared on settle | Timeout means no authoritative reply, never failed write |
| content readPreference | callback storage.local.get; invoked at startup/pageshow/apply | None | Generation-aware bounded read; late callback cannot resurrect obsolete work |
| content apply request | sendResponse waits for readPreference(done) | None (worker abandons at its message bound) | Bound own observation; preserve late callback ownership |

## Exact decision packet — pending

Proposed copy: **“Zhroma could not confirm that setting”**.

Keep the existing labelled native checkbox, set `indeterminate=true`, and
temporarily disable it. This asserts neither ON nor OFF. No extra button,
link, persistent key, permission, network path, or settings page is proposed.

Complete every worker response within **4000 ms of worker admission**, including
queue wait and every later asynchronous stage. Keep the popup's outer **5000 ms**
transport fallback. Bound admission; expire waiting requests without dispatching
their writes. A request deadline is not cancellation of Chrome storage.

After a raw write is issued, exclude other raw writes until its callback actually
settles. A fresh read, popup close/reopen, or caller timeout does not clear this
exclusion. Status requests still answer while a writer is stuck. Reopen or focus
uses a fresh bounded read for recovery; while the write is still pending the
state stays unknown even if a read happens to return a boolean.

**Native stall limit:** a write that never settles can keep changing the setting
unavailable until Chrome resolves it. A timeout cannot safely unlock it by itself.

**Worker epoch limit:** termination loses the in-memory exclusion. With exactly
one persisted boolean and no durable transaction/lock key, ordering between an
old pending native write and a new worker's write cannot be guaranteed. Fresh
reads establish observations, not a cross-worker transaction guarantee.

**Artwork limit:** a delayed native action write can leave transient stale toolbar
artwork until it settles and a current projection reconciles it. A caller timeout
does not recall that native side effect either.

The user may approve this exact proposal or specify different copy/recovery within
the one-switch boundary. A design needing durable cross-worker serialization or
another key/control/permission requires an explicit scope change. Do not infer
consent from old defaults language, AR-04-01, tests, or elapsed time.

## Evidence boundary and resume

Task 2 has no response yet; unknown_preference remains absent from DECISIONS.json.
04-16 stays blocked. Independent integrated code/security review belongs to
04-19. Final source/timing binding and human acceptance belong to 04-20. Changing
popup.js makes the old current-source binding stale; retain that expected failure
until 04-20, never suppress it or count it as a mutation kill. Historical
observations, ACK-04-01, AR-04-01, and Phase 3's human_needed state remain separate.
