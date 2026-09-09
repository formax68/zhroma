---
phase: 03-the-tint-survives-everything
status: human_needed
source_confirmation: pending
---

# Phase 03 Current-Source Live Acceptance

The CR-01/CR-02 runtime repair changed content.js. Current-source live acceptance is pending; none of the earlier observations has been relabelled for these bytes. The exact prior record, including sixteen user-reported passes and four pending checks, is preserved in [historical evidence](history/2026-09-09-before-runtime-repair/03-LIVE-ACCEPTANCE.md). Manual profiling remains deferred at the user's request. The repaired-source smoke checks below have now passed; remaining source metadata and full live validation stay user-controlled.

## Repaired-source smoke observation — 2026-09-09

The user replied **"all passed"** after instructions to reload the unpacked repository Zhroma extension, refresh the Zendesk document once for setup, open a Priority view, sort, use Next/Previous pagination, and switch to another view and back without further document refresh. Record correct automatic colours matching current priorities for those reported operations. Repository content.js remained at SHA-256 `aaf2596dd41e67b520d6accd9ff55ecf8ab525de0098571dc284c81773998dc2`; this is user-confirmed repository-directory loading, not an independent browser hash extraction.

Scope: initial Priority-view opening, sorting (sort keys unspecified), both pagination directions, and generic view switching passed. The prompt did not specify a landing-page start, both Priority/other-column sorts, or a Priority-absent destination; those extra variants are not inferred. The setup browser refresh does not count as Zendesk's native view-refresh check.

These observations are preserved now without requiring repetition. Canonical promotion awaits current browser/OS/mounted-row metadata, which was not supplied in this reply; old environment values are not silently reused. The canonical inventory remains pending where its full criteria or metadata have not yet been established. Manual profiling remains deferred. No phase-completion claim.

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

Exactly one JSON record governs consistency. Null values represent no observation. Browser/environment fields belong to the actual live run, not the synthetic Chrome profile. Current-source confirmation has not yet occurred. Earlier source-directory confirmation and observations remain in the historical record; they have not been transferred to this source.

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
  "loaded_from_repository": false,
  "source_confirmed_on": null,
  "environment": {
    "browser": null,
    "os": null,
    "mounted_rows": null
  },
  "checks": [
    {
      "id": "in-app-entry",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "delayed-entry",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
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
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "view-switch",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "pagination-next",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "pagination-previous",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "scroll",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
    },
    {
      "id": "grouped-sticky",
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
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
      "status": "pending",
      "evidence_kind": "pending",
      "observed_on": null,
      "evidence": null
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
        "reason": "Chrome back/forward-cache test reported not served from cache, with cache-control no-store, cookie-change and WebSocket eligibility reasons. User reported colours returned correctly after the round trip. Persisted document restoration was therefore not exercised; keep this required check pending for this run."
      }
    ]
  }
}
```
