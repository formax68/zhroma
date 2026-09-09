---
phase: 03-the-tint-survives-everything
plan: "04"
status: human_needed
gate: blocking-human
task: 2
---

# Pending live source confirmation and acceptance

**Current resumption note (2026-09-09):** CR-01/CR-02 repairs changed runtime source. The observation log below belongs to the pre-repair source and is preserved verbatim. Its sixteen passes remain historical; current-source confirmation and live checks are pending in 03-LIVE-ACCEPTANCE.md. Manual profiling remains deferred. See 03-REPAIR-SUMMARY.md for repair verification and independent gate outcomes. Do not resume the old source confirmation or promote these observations onto repaired bytes.

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

## Repaired-source smoke observation — 2026-09-09

The user replied **"all passed"** after instructions to reload the unpacked repository Zhroma extension, refresh the Zendesk document once for setup, open a Priority view, sort, use Next/Previous pagination, and switch to another view and back without further document refresh. Record correct automatic colours matching current priorities for those reported operations. Repository content.js remained at SHA-256 `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`; this is user-confirmed repository-directory loading, not an independent browser hash extraction.

Scope: initial Priority-view opening, sorting (sort keys unspecified), both pagination directions, and generic view switching passed. The prompt did not specify a landing-page start, both Priority/other-column sorts, or a Priority-absent destination; those extra variants are not inferred. The setup browser refresh does not count as Zendesk's native view-refresh check.

These observations are preserved now without requiring repetition. Canonical promotion awaits current browser/OS/mounted-row metadata, which was not supplied in this reply; old environment values are not silently reused. The canonical inventory remains pending where its full criteria or metadata have not yet been established. Manual profiling remains deferred. No phase-completion claim.

## Repaired-source refresh, scroll and tab return — 2026-09-09

The user replied **"all passed"** after instructions to use Zendesk's native view-refresh button, scroll down through the tickets and back up, switch to another browser tab for about twenty seconds, then return without a browser refresh. Correct colours remained or returned automatically. Record user-reported passes for refresh, scroll and tab-return on the unchanged repaired source `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`.

This does not establish row virtualization, unseen priority changes while inactive, persisted document restoration or quantitative performance. Preserve these actual observations without repetition; canonical promotion still awaits the current live environment metadata. Manual profiling stays deferred.

## Repaired-source grouped view and native interactions — 2026-09-09

The user replied **"all passed"** after instructions to check a grouped view while scrolling: group headings and the sticky column header stay untinted, and ticket colours remain correct. The user also checked hovering, selecting and deselecting a row, unread bold text and opening a ticket; these looked and behaved normally. Record a user-reported grouped-sticky pass and the stated native-interaction observations on unchanged content.js SHA-256 `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`.

Keyboard-focus traversal and a separate extension-disabled comparison were not explicitly requested in this batch and are not inferred. Opening a ticket normally is not the full ticket-isolation comparison. Preserve actual observations without repeating them; current environment metadata still awaits confirmation before canonical promotion. Manual profiling remains deferred and phase acceptance is not complete.

## Repaired-source delayed entry and Priority-absent switching — 2026-09-09

The user replied **"all passed"** after instructions to go to Zendesk's home/dashboard, wait twenty seconds, then open a Priority view, followed by switching to a view without a Priority column and back, without refreshing the browser between operations. Colours appeared automatically on entry; the Priority-absent view stayed untinted and correct colours returned in the Priority-present view. Record passes for delayed-entry, the observed landing-page-to-view entry, and the Priority-present/absent/present view-switch sequence on unchanged content.js SHA-256 `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`.

This is actual user-reported navigation evidence. It does not establish disabled/native dashboard isolation or persisted-document restoration. Preserve the completed checks without repetition. Current live environment metadata still awaits confirmation for canonical promotion; manual profiling remains deferred and full phase acceptance remains open.

## Current environment confirmation and promotion — 2026-09-09

The user replied **"nothing changed"** when asked to confirm Chrome 152.0.7977.77, macOS 27 beta 6, English Zendesk in light mode and 30 mounted ticket rows. Combined with the earlier instructed unpacked repository reload and one setup document refresh, this completes the reported source/environment metadata. All three repository asset hashes were rechecked and are unchanged through this observation sequence. Provenance is user-confirmed directory loading, not independent browser hash extraction.

Promoted nine complete checks: in-app-entry, delayed-entry, native refresh, view-switch, pagination-next, pagination-previous, scroll, grouped-sticky and tab-return. Generic sort and row-interaction observations remain preserved; Priority/other-column sorting and keyboard traversal were not explicitly covered. No completed observation needs repetition. Earlier log statements about pending metadata reflect their recording time and are superseded by this confirmation.

Current disposition: 9/20 passed, 11 pending, zero failed. Manual profiling remains deferred; no phase-completion claim.

## Repaired-source sorting variants and keyboard focus — 2026-09-09

The user replied **"all passed"** after instructions to sort by Priority and then another column, confirming colours still matched ticket priorities, and to use Tab through the view, confirming visible, normal keyboard focus. Source and confirmed environment are unchanged. Promoted sort and native-states, combining this keyboard observation with the already recorded hover, selection/deselection, unread and ticket-opening observations; those earlier actions were not repeated.

Current disposition: 11/20 passed, nine pending, zero failed. Remaining practical comparisons are ticket/dashboard/admin isolation and enabled/disabled responsiveness, followed by a separately reviewed user-controlled failure-cleanup operation. Persisted restoration and quantitative profiling remain pending/deferred. No phase-completion claim.
