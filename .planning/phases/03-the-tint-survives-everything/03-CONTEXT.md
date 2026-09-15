# Phase 3: The Tint Survives Everything - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning
**Decision authority:** The user said "sensible defaults are fine here" after the three remaining areas were presented. The choices below are agent-selected defaults under that delegation, not individually selected user answers.

<domain>
## Phase Boundary

Keep priority tinting correct through in-app view entry, sorting, refresh, view switching, Next/Previous pagination, and scrolling. Cover grouped rows and sticky headers, preserve responsiveness, and remove extension styling whenever the supported view cannot be safely interpreted. Covers DETECT-03, DETECT-04, LIVE-01 through LIVE-05, and FAIL-04. Toolbar diagnoses, hints, and the persistent toggle remain Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Transition Appearance — Delegated Defaults
- **D-01:** Prefer a brief native, untinted view over a stale or incorrect priority colour. When a DOM change invalidates the current interpretation, clear affected extension tint markers promptly; reapply only after the current table validates. Do not blank unchanged, still-valid tints for unrelated page mutations.
- **D-02:** Validate the table before applying its tint set. Preserve Phase 2's distinction: blank Priority cells stay untinted while recognised rows may tint; a non-empty unknown value, ambiguous ownership/header, or malformed table invalidates the table as a whole. Existing markers must also be cleared when a recognised priority becomes blank or unsafe.
- **D-03:** Restore colour without fades, flashing, overlays, spinners, or changes to native hover, selection, focus, and unread styling. Retain the settled stylesheet palette and direct-cell paint boundary.

### Automatic Recovery — Delegated Defaults
- **D-04:** A temporarily absent, incomplete, Priority-less, or unsupported table is a quiet no-op, not a permanent end to tinting for the document. Automatically retry when relevant DOM changes produce a supported, fully valid English view. No reload or user intervention should be needed.
- **D-05:** Recovery must include opening Zendesk and then clicking a view, even after spending longer than the existing 15-second startup window on the landing page. It must also include Next/Previous pagination, sorting, refresh, switching between views with and without Priority, and priority text changes on retained row nodes.
- **D-06:** On failure, remove only Zhroma-owned styling and leave native page content, attributes, and interaction behavior intact. Do not expose errors or diagnostic UI in the page. Do not retain a partly applied table after a failed write. Keep the future Phase 4 diagnosis seam possible without adding toolbar behavior now.

### Long-Session Behavior — Delegated Defaults
- **D-07:** Returning from a ticket, dashboard, or other non-view surface to a supported view restores tint automatically. Those non-view surfaces remain visually untouched. Use the DOM evidence boundary; do not introduce history patching, route detection, webNavigation, or new permissions.
- **D-08:** Returning to the browser tab after inactivity must show current priorities without a manual refresh. Revalidate on return as needed, including supported document restoration. Background work should remain bounded and event-driven; exact lifecycle events and scheduling are planner discretion.
- **D-09:** Repeated navigation must not accumulate observers, pending work, or retained detached rows. No ticket data is persisted, transmitted, or logged. Reuse currently installed test tooling; additional dependency versions require their own approval.

### Carried-Forward Acceptance Constraints
- **D-10:** Preserve exact English labels and the supported current Agent Workspace boundary; never guess priority or tint group/sticky-header rows. Resolve column ownership from current table evidence. The observed sticky header is in the same table: do not invent a sibling-table relationship merely because the original roadmap anticipated one. Investigate any newly encountered topology before widening selectors.
- **D-11:** Keep the measured budget from the existing research: under 2 ms per typical re-tint pass, under 16 ms worst case, zero forced layouts in the hot path, and no detached-node growth across thirty view switches. Research/planning must define a reproducible workload and distinguish real live evidence from synthetic larger-table tests; the observed live page had 30 mounted ticket rows.
- **D-12:** Explicitly verify in-app entry, Next/Previous, sorting, refresh, view switching, scrolling, grouped/sticky-header behavior, failure cleanup, and non-view isolation. Offline tests establish DOM behavior; live visual, responsiveness, and memory checks remain separate evidence. Retain the user-controlled authenticated interaction and sanitization protocol from prior phases.

### the agent's Discretion
- Choose observer scope, mutation filtering, coalescing, bounded scheduling, cleanup ownership, and lifecycle handling. Existing research's 50 ms debounce is a starting hypothesis to validate, not a newly measured guarantee.
- Choose module structure and meaningful regression tests within the source-equals-shipped, no-build constraint.
- Keep performance work within the existing budget and product outcomes; no need to ask the user to choose timer constants or implementation patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` — Phase 3 scope, acceptance criteria, explicit in-app entry and pagination follow-ups, and route-detection prohibition.
- `.planning/REQUIREMENTS.md` — Detection, liveness, FAIL-04, and v1 exclusions.
- `.planning/PROJECT.md` — Product, privacy, permissions, and supported-shell constraints.
- `.planning/phases/02-first-tint-on-a-real-view/02-CONTEXT.md` — Settled palette, blank/unsafe rules, permissions, and evidence protocol.
- `.planning/phases/01-dom-recon-spike/01-CONTEXT.md` — Authenticated interaction and fixture confidentiality requirements.
- `SELECTORS.md` — Admitted selector, same-table sticky-header, group-row, and scrolling evidence; distinguish observations from fallback hypotheses.
- `test/fixtures/manifest.json` — Admitted fixture provenance and checksums.
- `.planning/research/ARCHITECTURE.md` — Observer/lifecycle hypotheses and original architecture; reconcile with current admitted evidence.
- `.planning/research/PITFALLS.md` — Performance budget, failure cleanup, observer feedback, and memory-leak gates.

No new external specifications were introduced during this discussion.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `extension/content.js`: `inspectCandidateTable` already validates exact English priorities, same-table ownership, and group exclusion. `commitSnapshot` revalidates and rolls back failed writes. Extend these guarantees to ongoing updates and stale-marker cleanup.
- `extension/zhroma.css`: Existing namespaced `data-zhroma-priority` styling on direct ticket cells; palette is already accepted.
- `test/extension/initial-tint.test.js`, `test/extension/runtime-contract.test.js`, and `test/extension/live-acceptance.test.js`: Existing runtime and acceptance regression seams.
- `test/fixtures/zendesk-view-priority-present.html`, `test/fixtures/zendesk-view-priority-absent.html`, and `test/fixtures/zendesk-view-grouped-long.html`: Admitted offline scenario corpus.

### Established Patterns
- The existing startup observer stops after its first safe/unsafe result or a 15-second deadline. Phase 3 must replace this one-shot lifecycle to meet the in-app entry and reapplication requirements.
- Current inspection requires one candidate table. Do not relax ambiguity protection without evidence supporting the new ownership rule.
- No runtime network calls, bundler, or product colour literals in JavaScript. `extension/manifest.json` remains the settled permission surface.

### Integration Points
- Ongoing observation, safe reconciliation, and teardown connect in `extension/content.js`.
- Extend runtime tests with transition, cleanup, recovery, and lifecycle scenarios; keep live performance evidence distinct from offline parsing tests.

</code_context>

<specifics>
## Specific Ideas

- The user's sole new decision was delegation: "sensible defaults are fine here".
- Phase 2's two startup reports were clarified as in-app entry, including from a fresh tab. Direct-document controls passed; do not describe Phase 2 as having an unresolved direct-document startup defect.
- The observed 30-row page retained offscreen rows. Cover replacement and retained-node changes without claiming live virtualization was observed.

</specifics>

<deferred>
## Deferred Ideas

None newly introduced. Preserve Phase 4 toolbar states, hints, and persistent toggle; Phase 5 publication; and v2 dark mode, colourblind-safe/custom palettes, alternative treatments, and extra locales.

</deferred>

---

*Phase: 03-the-tint-survives-everything*
*Context gathered: 2026-09-09*
