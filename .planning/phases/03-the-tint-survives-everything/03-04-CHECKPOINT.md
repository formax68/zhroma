---
phase: 03-the-tint-survives-everything
plan: "04"
status: human_needed
gate: blocking-human
task: 2
---

# Pending live source confirmation and acceptance

Completed Task 1: e26d697 and d19e1e4; files test/extension/phase-03-live-acceptance.test.js and 03-LIVE-ACCEPTANCE.md. All 27 validator tests and 393 combined tests pass. Plans 03-01/02/03 were executed; 03-04 is 1/2 tasks complete. Do not count the halted 03-04 summary as completion or start Phase 4.

Current content.js SHA-256: 85aa975028d5c2653167a5c13a7d9e6031891b43ba0cf03a7ac6285dce5c2ac1. Scheduler: one non-resetting zero-delay timeout, no startup deadline. Manifest/CSS unchanged. Exact full hashes are in the live and performance records.

Awaiting: user reloads the unpacked repository extension and refreshes the Zendesk document once to replace the old instance, confirms current source/browser/environment and actual mounted row count, then performs the twenty prepared operations. All authenticated navigation and interactions belong to the user. Retain only dated sanitized aggregates; no raw live captures. Do not use a document refresh as an operational recovery workaround after setup.

The exact selector-only failure control needs user control/approval before execution. Inaccessible restoration/admin checks stay pending with reasons. Failed observations produce gaps_found without code changes inside this checkpoint. A source change requires a new source-bound run.

Open synthetic dimensions: layout attribution and extension-retainer attribution remain human_needed despite passing timing and zero aggregate detached growth in enabled/disabled thirty-switch profiles. See 03-PERFORMANCE.md. User acknowledgment is not observation or acceptance. Independent code/security/goal verification remains after required live acceptance. Preserve E01/E14/E15/E16, descriptor-less judgments and permanent-native-removal limitation.

Resume Task 2 directly after reading the user's actual results; preserve completed Task 1 and all existing evidence. The halted SUMMARY exists to make partial execution explicit and prevent duplicate work.

## Live observation log — 2026-09-09

- delayed-entry: user reported "pass" after the instructed home/dashboard → wait 20 seconds → Priority view sequence, without a browser refresh. This confirms automatic colours matching displayed priorities for that check only. Canonical record promotion awaits completion of source/environment metadata; preserve this actual observation rather than asking the user to repeat it.
- sort: user reported "pass" after sorting by Priority and then another column without refreshing the browser; colours remained matched to each ticket's priority after both sorts. Canonical record promotion awaits source/environment metadata.
- refresh: user reported "pass" after using Zendesk's native view refresh button; colours returned automatically and matched the refreshed tickets' priorities. Canonical record promotion awaits source/environment metadata.
- view-switch: user reported "pass" after switching to a view without Priority and back without refreshing the browser; the Priority-absent view stayed untinted and correct colours returned automatically in the Priority-present view. Canonical record promotion awaits source/environment metadata.
- pagination-next and pagination-previous: user reported "pass" after clicking Next and then Previous in a multi-page Priority view without refreshing the browser; correct colours appeared automatically on both pages. Canonical record promotion awaits source/environment metadata.
- scroll: user reported "pass" after scrolling down through a long Priority view and back up; revealed tickets kept colours matching their priorities, with no missing or stale tint. This does not establish whether rows were virtualized or recycled. Canonical record promotion awaits source/environment metadata.
- grouped-sticky: user reported "pass" after opening a grouped Priority view and scrolling until the column header stuck; group headings and the sticky header remained untinted while ticket colours matched Priority. This is visual confirmation, not a new DOM-topology observation. Canonical record promotion awaits source/environment metadata.
- native-states: user reported "pass" for hover, row selection and its left-edge indicator, unread bold text, keyboard focus and opening a ticket; these behaved normally with no flashing, overlays or added spinners. Canonical record promotion awaits source/environment metadata.
- tab-return: user reported "pass" after switching to another browser tab for about 20 seconds and returning without refreshing; correct ticket colours were present automatically. No unseen priority change is inferred. Canonical record promotion awaits source/environment metadata.
- ticket-isolation: user reported "pass" after comparing a ticket page with Zhroma disabled and enabled, refreshing once after each change; appearance and interactions were the same in both cases. Canonical record promotion awaits source/environment metadata.
- dashboard-isolation: user reported "pass" after comparing the Zendesk dashboard with Zhroma disabled and enabled, refreshing once after each change; appearance and interactions were the same in both cases. Canonical record promotion awaits source/environment metadata.
- admin-isolation: user reported "pass" after comparing the accessible admin area with Zhroma disabled and enabled, refreshing once after each change without changing settings; appearance and interactions were the same in both cases. Canonical record promotion awaits source/environment metadata.
- live-responsiveness: user reported "pass" for the enabled/disabled comparison of sorting, pagination, scrolling and opening tickets, with one refresh after each toggle; interpreted in the established pass/fail workflow as no noticeable added slowdown or stutter. This is subjective responsiveness evidence, not measured callback CPU, forced-layout or memory attribution. Canonical record promotion awaits source/environment metadata.
- source confirmation: user replied "confirmed" to the request to confirm the unpacked extension from /Users/mike/code/zhroma/extension. Record this as repository-directory confirmation only; no Chrome/macOS version or mounted-row count was supplied. Do not substitute the synthetic benchmark environment for the live environment. Canonical promotion remains pending that metadata.
- live environment: user supplied "MacOS 27 beta 6, Chrome Version 152.0.7977.77". Preserve these live versions separately from the synthetic benchmark environment. Actual mounted-row count remains unreported.
- Next step: obtain the actual mounted-row count, then promote the accumulated observations without repeating completed checks. Quantitative CPU, layout, memory, deliberate cleanup and document-restoration checks remain outstanding.

- mounted rows: user returned 30 from the exact read-only current-ticket-row selector. Source/environment metadata is now complete. Fourteen reported checks were promoted to the canonical live record on 2026-09-09 after verifying unchanged repository hashes; earlier log references to pending promotion are historical. Six checks and separate profile attribution remain open.
- Next check: immediate home/dashboard to Priority-view entry without a browser refresh.

- in-app-entry: user answered "yes" after immediate home/dashboard to Priority-view entry without browser refresh; correct colours appeared automatically. Canonical record now has 15/20 reported live passes.
- Next check: reviewed user-controlled selector-only failure cleanup and recovery; exact operation requires user approval before execution.

- failure-cleanup: user requested instructions, then answered "yes" to the reviewed user-executed five-second data-test-id removal/restoration test. All ticket colours disappeared and returned correctly. Canonical live record now has 16/20 reported passes. This does not establish permanent native-removal fault guarantees.
- Remaining live checks: document-restoration, live-pass-budget, live-forced-layout and live-thirty-switch-memory. Document restoration requires evidence of persisted pageshow; ordinary in-app navigation or tab return is insufficient.

- document-restoration attempt: user reported "colours returned fine." The supplied DevTools result states not served from back/forward cache and reports no-store, cookie-change and WebSocket eligibility reasons. Record successful ordinary return as supplementary evidence; persisted restoration was not exercised and remains pending with an unavailable-scenario reason. No screenshot, tenant URL, identifiers or raw frame details were copied into artifacts. Canonical total remains 16/20 passed.
- Next checks: measured live callback CPU, forced-layout attribution and thirty-switch memory comparison.

- Live CPU inspection in progress: user recorded one Priority-view sort with screenshots off and no CPU throttling, then located reconcileCurrentTable and reported "0.16 ms (self 39 μs)". Retain 0.16 ms inclusive duration and 0.039 ms self time for this single callback only. Observer filtering/invalidation and other callbacks from the same triggering batch have not yet been collected; no total-batch timing or median/p95/max acceptance is claimed.

- Live CPU continuation: in response to selecting the enclosing observer callback from content.js around line 187, user reported "11 μs" (0.011 ms). The two reported inclusive callback durations sum to 0.171 ms. Other same-sort callbacks have not yet been ruled out, and no representative distribution or live-pass-budget acceptance is established.

## Manual profiling deferred — 2026-09-09

The user said, "I don't know but we are overccomplicating. let's move on" after the callback-count question. Stop further manual profiling questions. Preserve 16/20 live passes, four pending checks, the unavailable persisted-restoration scenario and the partial callback measurements. This is a decision to defer measurement, not a failed observation, a full-batch timing result or acceptance of unresolved risks. Proceed with independent code/security review; phase completion remains unclaimed.
