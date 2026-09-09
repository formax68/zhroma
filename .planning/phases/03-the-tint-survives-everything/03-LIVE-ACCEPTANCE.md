---
phase: 03-the-tint-survives-everything
status: human_needed
source_confirmation: pending
---

# Phase 03 Current-Source Live Acceptance

All twenty checks are pending. Automated consistency tests, historical Phase 2 observations and synthetic Chrome measurements do not constitute current live observations. No new runtime source has been confirmed as loaded in an authenticated document.

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

Synthetic timing passed for all 1800 enabled plus 1800 disabled samples. Synthetic layout/retainer attribution remains human_needed in 03-PERFORMANCE.md; no zero-attributed result has been established. Even if all live rows later pass, full acceptance remains human_needed until those current-source synthetic attribution dimensions are accepted. Independent code review, security and phase goal verification follow separately.

Four unclassified probes (E01/E14/E15/E16), three descriptor-less prohibition judgments and the permanent-native-removal platform limit need explicit independent dispositions. A permanently failing native removal API can defeat literal cleanup; neither a unit-test pass nor this checklist makes that platform guarantee possible.

## Canonical record

Exactly one JSON record governs consistency. Null values represent no observation. Browser/environment fields belong to the actual live run, not the synthetic Chrome profile.

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
    "content.js": "85aa975028d5c2653167a5c13a7d9e6031891b43ba0cf03a7ac6285dce5c2ac1",
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
    "unavailable_scenarios": []
  }
}
```
