---
phase: 03-the-tint-survives-everything
status: human_needed
source_confirmation: user-confirmed
---

# Phase 03 Current-Source Live Acceptance

Nine of twenty current-source live checks now have confirmed user-reported passes. Repository-directory reload and the unchanged Chrome 152.0.7977.77, macOS 27 beta 6, English/light Zendesk environment with 30 mounted rows were confirmed on 2026-09-09. Generic sorting and stated row interactions also passed, but narrower untested variants remain pending. Earlier sixteen-pass evidence remains separately preserved in [historical evidence](history/2026-09-09-before-runtime-repair/03-LIVE-ACCEPTANCE.md). Manual profiling stays deferred; phase status remains human_needed.

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

## Start with source confirmation

1. In Chrome Extensions, reload the unpacked repository extension. Refresh the Zendesk document once to replace the previous content-script instance; this is setup, not an allowed recovery workaround during tests.
2. Confirm that this is the repository source identified by the three hashes below. Confirm Chrome version, OS, English current Agent Workspace/light appearance, and actual mounted ticket-row count. Do not infer the row count from old observations or the synthetic stress workload.
3. Record the confirmation date and set loaded_from_repository only after this confirmation. Begin observations afterward. Any source change invalidates this run: preserve old observations as history and start new source-bound evidence.

The user controls login, MFA, navigation and authenticated interactions. Retain only dated sanitized aggregate outcomes. Do not retain tenant identity, ticket text, account identifiers, local private paths, screenshots, raw DOM, live heap dumps or traces.

## Operation checklist

| Check | Required observation |
|---|---|
| in-app-entry | Open Zendesk landing surface, then enter a view; supported priorities tint without refreshing. |
| delayed-entry | Spend more than 15 seconds on the non-view surface, then enter the view; tint recovers. |
| sort | Sort priorities and another column; retained/replaced rows follow current values and native order. |
| refresh | Use native view refresh; tint returns after replacement without a document reload workaround. |
| view-switch | Switch Priority-present → absent → present; unsafe/absent states stay native and return tints. |
| pagination-next | Next page receives correct current tints after incomplete loading intervals. |
| pagination-previous | Previous page receives correct tints; no stale previous-page markers. |
| scroll | Scroll through mounted rows and any revealed rows; record what is actually observed without claiming virtualization. |
| grouped-sticky | Groups and same-table sticky headers stay native; current Priority mapping belongs to each ticket. Investigate novel topology before widening selectors. |
| native-states | Hover, selection/first-cell inset, unread/bold and focus/click remain intact; no animation, overlay, spinner or palette change. |
| failure-cleanup | After user-controlled, reviewed selector-only removal on a tinted row/table, styling clears; restore attribute and verify recovery. Compare disabled/native appearance. |
| ticket-isolation | Ticket surface matches extension-disabled native behavior. |
| dashboard-isolation | Dashboard matches extension-disabled native behavior. |
| admin-isolation | Available admin surface matches extension-disabled behavior; unavailable access stays pending with reason. |
| tab-return | Change/wait while inactive; returning visible restores current priorities. |
| document-restoration | Available persisted restoration resumes correctly without reinjection. If unavailable, keep pending with reason. |
| live-responsiveness | Compare enabled/disabled scrolling, sorting, navigation and clicks at actual mounted count. |
| live-pass-budget | Sum full extension observer filtering/invalidation and scheduled reconciliation CPU per triggering batch; retain median/p95/max and separate scheduling latency. Typical median <2 ms; recorded worst <16 ms. |
| live-forced-layout | Inspect synchronous forced-reflow stacks attributable to content.js callbacks, distinguishing later native rendering; require zero attributable forced layouts. |
| live-thirty-switch-memory | Compare post-GC resting snapshots before/after thirty user-controlled switches returning to the same view, with disabled control and cleared console references. Require zero extension-retained detached growth by retainer attribution. |

Do not execute the deliberate selector edit until the user controls and approves that exact ephemeral DOM operation. It must never mutate ticket data. Record inaccessible scenarios in unavailable_scenarios while keeping the corresponding check pending. Failed observations produce gaps_found and a reproduction; do not repair code or rebind evidence inside this checkpoint.

## Performance and independent gates

Repaired-source synthetic timing passed: 1800 enabled and 1800 disabled samples, largest 30-row median 1.400 ms and overall maximum 14.500 ms. Full results and historical runs are in 03-PERFORMANCE.md. Synthetic layout/retainer attribution remains human_needed in 03-PERFORMANCE.md; no zero-attributed result has been established. Even if all live rows later pass, full acceptance remains human_needed until those current-source synthetic attribution dimensions are accepted. Independent code review, security and phase goal verification follow separately.

Four unclassified probes (E01/E14/E15/E16), three descriptor-less prohibition judgments and the permanent-native-removal platform limit need explicit independent dispositions. A permanently failing native removal API can defeat literal cleanup; neither a unit-test pass nor this checklist makes that platform guarantee possible.

## Canonical record

Exactly one JSON record governs consistency. Null values represent no observation. Browser/environment fields belong to the actual live run, not the synthetic Chrome profile. Current-source directory and environment confirmation are complete. Only observations actually reported for the repaired source are promoted; pre-repair observations remain historical.

```json
{
  "schema_version": 1,
  "status": "human_needed",
  "scope": {
    "language": "English",
    "html_lang": "en",
    "shell": "current Agent Workspace",
    "interface": "light"
  },
  "runtime_sha256": {
    "manifest.json": "0c959d71e71b34f5f5d4bc75ffc84f7838f09cc7f0db95d24ad605d45ca57ee6",
    "content.js": "aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2",
    "zhroma.css": "f5af38707480b2379d00343d36ec3a54b27ae79e95a09ad00a4538230c586b61"
  },
  "settings": {
    "reconcile_delay_ms": 0,
    "startup_deadline_ms": null
  },
  "loaded_from_repository": true,
  "source_confirmed_on": "2026-09-09",
  "environment": {
    "browser": "Chrome 152.0.7977.77",
    "os": "macOS 27 beta 6",
    "mounted_rows": 30
  },
  "checks": [
    {
      "id": "in-app-entry",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed after opening a Priority view from the Zendesk home/dashboard without a browser refresh; correct colours appeared automatically."
    },
    {
      "id": "delayed-entry",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed after waiting twenty seconds on the Zendesk home/dashboard and then opening a Priority view without a browser refresh; correct colours appeared automatically."
    },
    {
      "id": "sort",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "refresh",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed after using Zendesk's native view-refresh button without refreshing the browser; correct colours remained or returned automatically."
    },
    {
      "id": "view-switch",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed for Priority-present to Priority-absent to Priority-present switching without browser refresh: the absent-column view stayed untinted and correct colours returned in the Priority view."
    },
    {
      "id": "pagination-next",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed for Next pagination without browser refresh; colours appeared automatically and matched current ticket priorities."
    },
    {
      "id": "pagination-previous",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed for Previous pagination without browser refresh; colours appeared automatically and matched current ticket priorities."
    },
    {
      "id": "scroll",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed after scrolling down through tickets and back up without browser refresh; colours remained correct. No virtualization claim is made."
    },
    {
      "id": "grouped-sticky",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed in a grouped view while scrolling: group headings and the sticky column header stayed untinted while ticket colours remained correct."
    },
    {
      "id": "native-states",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "failure-cleanup",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "ticket-isolation",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "dashboard-isolation",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "admin-isolation",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "tab-return",
      "status": "pass",
      "evidence_kind": "live",
      "observed_on": "2026-09-09",
      "evidence": "User reported all passed after switching to another browser tab for about twenty seconds and returning without browser refresh; colours remained correct or returned automatically. No unseen priority-change claim is made."
    },
    {
      "id": "document-restoration",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "live-responsiveness",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "live-pass-budget",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "live-forced-layout",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "live-thirty-switch-memory",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    }
  ],
  "limitations": {
    "unresolved_observed_defects": [],
    "unavailable_scenarios": [
      {
        "id": "document-restoration",
        "reason": "The pre-repair run could not exercise persisted back/forward-cache restoration (reported cache-control no-store, cookie-change and WebSocket eligibility reasons). That observation is historical; availability has not been rechecked on the repaired source. Persisted restoration remains pending, and ordinary tab return does not establish it."
      }
    ]
  }
}
```
