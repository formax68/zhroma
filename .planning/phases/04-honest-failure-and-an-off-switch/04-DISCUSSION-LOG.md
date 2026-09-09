# Phase 4: Honest Failure and an Off Switch - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 04-honest-failure-and-an-off-switch
**Areas discussed:** Missing-column certainty

---

## Gray Area Selection

Four gray areas were offered. The user selected one.

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar state vocabulary | Three distinct icon artworks vs. one icon plus a badge; what the toolbar shows when OFF or off-Zendesk; how many PNGs the choice requires | |
| Missing-column certainty | When the missing-column diagnosis is certain; the all-blank column; where the hint lives | ✓ |
| Toggle scope & immediacy | Global vs. per-tab; cross-tab propagation; `storage.local` vs. `storage.sync`; user-off vs. visibility pause | |
| Popup contents & boundary | Copy beyond the switch; instructions or outbound link; off-Zendesk behaviour; staying out of options-page territory | |

**Notes:** The three unselected areas were recorded in CONTEXT.md `<deferred>` as unresolved and in scope, explicitly **not** as delegated defaults. Unlike Phases 2 and 3, no "sensible defaults are fine" delegation was given here.

---

## Missing-Column Certainty

### Q1 — What has to be true before Zhroma is allowed to say "this view has no Priority column"?

Framing given: `inspectCandidateTable` currently returns `waiting` for seven distinct situations, only one of which is a genuinely missing column.

| Option | Description | Selected |
|--------|-------------|----------|
| Headers complete, no Priority | Fire as soon as a well-formed header row contains no cell reading exactly `Priority`. Fastest, but risks a wrong accusation during the window where Zendesk has rendered the header table but not the body | |
| Headers complete + at least one full ticket row | Also require a ticket row whose cell count matches the header count, proving the table is genuinely rendered. Uses signals already computed; rules out the main false-positive window | |
| Both, plus a settle window (Recommended) | Both of the above, plus no interpretation-affecting mutation for a quiet period before the state flips. Slowest to accuse, hardest to be wrong. Costs one more timer and a brief neutral state on views that genuinely lack the column | ✓ |

**User's choice:** Both, plus a settle window
**Notes:** Became D-01. Settle-window duration left to Claude's discretion — no user constraint given.

---

### Q2 — A view has a Priority column but every cell is empty. Nothing tints. What does Zhroma report?

Framing given: the code already has a distinct `blank` state; Phase 2 D-05 forbids ever calling it a missing column. Phase 1 evidence showed 7 readable against 23 empty-or-unreadable cells in the observed ungrouped view, so this is realistic rather than an edge case.

| Option | Description | Selected |
|--------|-------------|----------|
| Working; popup adds one line (Recommended) | Toolbar shows working; popup explains a Priority column was found but no values are set. Keeps exactly three toolbar states and puts nuance where there is room | ✓ |
| Plain working, no explanation | Indistinguishable from a normal working view. Simplest, but an agent staring at a colourless list has no way to find out why | |
| Its own visible state | A fourth visibly distinct toolbar state. Most informative, but breaks the three-state commitment and spends artwork on a condition the agent may not care about | |

**User's choice:** Working; popup adds one line
**Notes:** Became D-02.

---

### Q3 — Where does the "add a Priority column" hint actually appear?

Framing given: a documented tension between PROJECT.md ("show an unobtrusive hint", location unspecified), ROADMAP Phase 4 SC1 ("opening the popup tells the agent to add the column"), and FAIL-04 plus the Phase 2 D-06 / Phase 3 D-06 no-page-diagnostic-UI decisions.

| Option | Description | Selected |
|--------|-------------|----------|
| Popup only (Recommended) | The distinct toolbar icon is the entire in-toolbar signal; wording lives in the popup; the page is never touched, so FAIL-04 holds with no exception carved out | ✓ |
| Popup plus a badge overlay | An extra badge stacked on the already-distinct icon to pull the eye. Better discovery, at the cost of a second visual language and a permanent nag on views that legitimately have no Priority column | |
| In-page banner above the table | Most discoverable, but directly contradicts FAIL-04 as written and both prior phases' decisions. Choosing it means deliberately amending FAIL-04, not just adding a feature | |

**User's choice:** Popup only
**Notes:** Became D-03, rated `costly` to reverse — undoing it would require amending FAIL-04, re-opening two prior phases' decisions, and adding a DOM-construction path to a runtime whose contract test asserts the shipped source contains no `createElement`, `innerHTML`, `insertAdjacentHTML` or `.style` write.

---

### Q4 — Zhroma can't read the view, but it's structural rather than a language problem. What does it report?

Framing given: `unsafe` today lumps together the locale family (`html[lang] !== "en"`, non-top-frame) and the structural family (multiple or nested tables, malformed cells, two `Priority` headers, unrecognised non-empty values, odd group-row topology). FAIL-01 commits to three states; FAIL-03 only forbids blaming a missing column.

| Option | Description | Selected |
|--------|-------------|----------|
| Shared state, branching wording (Recommended) | Both families share the third toolbar state; the popup names the language only when `html[lang]` really is not `en`, and otherwise says it cannot read the ticket table | ✓ |
| Shared state, one generic wording | Never distinguish the two. Simplest and impossible to word wrongly, but a genuinely non-English agent is never told language is the reason — the specific thing FAIL-03 exists to surface | |
| Four states, split on the toolbar | Each family gets its own visible toolbar state. Most precise, but breaks the three-state commitment in FAIL-01 and the roadmap success criteria | |

**User's choice:** Shared state, branching wording
**Notes:** Became D-04.

---

### Q5 — Continue or write context?

| Option | Description | Selected |
|--------|-------------|----------|
| Write CONTEXT.md now | Four decisions is enough to plan from; the three unselected areas get recorded as open items | ✓ |
| Discuss popup contents next | D-02 and D-04 just made the popup carry the honesty burden across five messages | |
| More on missing-column certainty | Settle-window duration, views that never get ticket rows, clearing a previous view's diagnosis on switch | |
| Discuss toggle scope & immediacy | Global vs. per-tab, cross-tab clearing, `storage.local` vs. `storage.sync`, user-off vs. pause | |

**User's choice:** Write CONTEXT.md now

---

## Claude's Discretion

The user did not use a "you decide" option at any point. Discretion recorded in CONTEXT.md is bounded and derived from what was left unspecified rather than delegated:

- Internal state-model naming replacing `safe` / `waiting` / `unsafe` / `blank`, and how the settle window is implemented, provided D-01's three conditions gate the claim.
- The settle-window duration.
- The messaging seam between content script, popup and any service worker; module and test organisation.
- Exact popup copy, within the distinctions D-02, D-03 and D-04 require.

## Deferred Ideas

No new ideas were raised during discussion, and no scope creep needed redirecting.

Three offered-but-unselected gray areas remain **in scope for this phase and unresolved** — toolbar state vocabulary, toggle scope and immediacy, and popup contents and boundary. They are recorded in CONTEXT.md `<deferred>` with the invariants that bound them. They are not delegated defaults.

Existing out-of-phase scope was preserved unchanged: Phase 3 keeps ongoing liveness and FAIL-04 page cleanup; Phase 5 keeps publication, privacy policy and the pre-submission checklist; v2 keeps dark mode, the colourblind-safe palette, custom colours, alternative treatments and additional locales.
